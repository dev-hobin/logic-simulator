import {
  program,
  InvalidArgumentError,
  InvalidOptionArgumentError,
} from 'commander'
import prompts, { type Answers } from 'prompts'
import chalk from 'chalk'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

type Framework = 'react' | 'vanilla'
type Variant = 'js' | 'ts'
type Template = `${Framework}-${Variant}`

const FRAMEWORKS: Framework[] = ['vanilla', 'react']
const VARIANTS: Variant[] = ['js', 'ts']
const RENAME_FILES: Record<string, string> = {
  _gitignore: '.gitignore',
}

const isValidPath = (p: string) => !path.dirname(path.resolve(p)).includes('.')
const validatePath = (p: string | undefined) => {
  if (p === undefined || isValidPath(p)) return p
  throw new InvalidArgumentError('\nThe path cannot be found')
}
const isValidTemplate = (t: string): t is Template => {
  const [framework, variant] = t.split('-') as [Framework, Variant]
  return FRAMEWORKS.includes(framework) && VARIANTS.includes(variant)
}
const validateTemplate = (t: string | undefined) => {
  if (t === undefined || isValidTemplate(t)) return t
  throw new InvalidOptionArgumentError(
    '\nPlease select one of these options: vanilla-js, vanilla-ts, react-js, react-ts',
  )
}

program
  .argument('[projectDir]', 'project root directory', validatePath)
  .option(
    '--template <template>',
    'template to use : vanilla-js, vanilla-ts, react-js, react-ts',
    validateTemplate,
  )
  .parse()

const argProjectDir = program.processedArgs[0]
const [argFramework, argVariant] = program
  .opts<{ template?: Template }>()
  .template?.split('-') ?? [undefined, undefined]

const scaffold = async () => {
  const initialValues = {
    projectPath: argProjectDir ? path.resolve(argProjectDir) : undefined,
    framework: argFramework,
    variant: argVariant,
    overwrite: 'no',
  }
  let answers: Answers<'projectPath' | 'framework' | 'variant' | 'overwrite'>
  try {
    answers = {
      ...initialValues,
      ...(await prompts(
        [
          {
            type: initialValues.projectPath ? null : 'text',
            name: 'projectPath',
            message: 'Project name:',
            initial: 'logic-simulator',
            format: (v) => path.resolve(v),
            validate: (v) => (!isValidPath(v) ? 'invalid project name' : true),
          },
          {
            type: (_, values) => {
              const projectPath =
                values.projectPath ?? initialValues.projectPath
              return isDirectoryExist(projectPath) &&
                !isEmptyDirectory(projectPath, { excludes: ['.git'] })
                ? 'select'
                : null
            },
            name: 'overwrite',
            message:
              'Target directory is not empty. Please choose how to proceed:',
            initial: 0,
            choices: [
              {
                title: 'Remove existing files and continue',
                value: 'yes',
              },
              {
                title: 'Cancel operation',
                value: 'no',
              },
            ],
          },
          {
            type: (_, values) => {
              if (values?.overwrite === 'no') {
                throw new Error(chalk.red('✖') + ' Operation cancelled')
              }
              return null
            },
            name: 'overwriteChecker',
          },
          {
            type: initialValues.framework ? null : 'select',
            name: 'framework',
            message: 'Select a framework',
            initial: 0,
            choices: [
              { title: chalk.yellow('Vanilla'), value: 'vanilla' },
              { title: chalk.blue('React'), value: 'react' },
            ],
          },
          {
            type: initialValues.variant ? null : 'select',
            name: 'variant',
            message: 'Select a variant',
            initial: 0,
            choices: [
              { title: chalk.yellow('Javascript'), value: 'js' },
              { title: chalk.blue('Typescript'), value: 'ts' },
            ],
          },
        ],
        {
          onCancel: () => {
            throw new Error(chalk.red('✖') + ' Operation cancelled')
          },
        },
      )),
    }
  } catch (cancelled: any) {
    console.log(cancelled.message)
    return
  }

  const { projectPath, framework, variant, overwrite } = answers

  const templatePath = path.resolve(
    fileURLToPath(import.meta.url),
    '../../templates',
    `${framework}-${variant}`,
  )

  if (overwrite === 'yes') {
    emptyDirectory(projectPath, { excludes: ['.git'] })
  }

  if (!isDirectoryExist(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true })
  }

  for (const fileName of readDirectory(templatePath).filter(
    (fileName) => fileName !== 'package.json',
  )) {
    const src = path.join(templatePath, fileName)
    const dest = path.join(projectPath, RENAME_FILES[fileName] ?? fileName)

    if (isDirectory(src)) {
      copyDirectory(src, dest)
    } else {
      copyFile(src, dest)
    }
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templatePath, 'package.json'), 'utf-8'),
  )
  pkg.name = path.basename(projectPath)
  writeFile(projectPath, 'package.json', JSON.stringify(pkg, null, 2))
}

const readDirectory = (path: string) => fs.readdirSync(path)
const writeFile = (dirPath: string, name: string, content: string) => {
  fs.writeFileSync(path.join(dirPath, name), content)
}
const copyFile = (srcPath: string, destPath: string) => {
  fs.copyFileSync(srcPath, destPath)
}
const isDirectory = (path: string) => {
  return fs.statSync(path).isDirectory()
}
const isDirectoryExist = (path: string) => {
  return fs.existsSync(path) && isDirectory(path)
}
const isEmptyDirectory = (
  path: string,
  { excludes }: { excludes: string[] } = { excludes: [] },
) => {
  const files = fs.readdirSync(path)
  const excludesSet = new Set(excludes)

  return (
    files.length === 0 ||
    (files.length === excludesSet.size &&
      files.every((file) => excludesSet.has(file)))
  )
}
const emptyDirectory = (
  dir: string,
  { excludes }: { excludes: string[] } = { excludes: [] },
) => {
  for (const file of readDirectory(dir)) {
    if (excludes.includes(file)) {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}
const copyDirectory = (srcDirPath: string, destDirPath: string) => {
  const stack = [{ src: srcDirPath, dest: destDirPath }]

  while (stack.length > 0) {
    const curr = stack.pop()
    if (!curr) continue

    const { src, dest } = curr
    fs.mkdirSync(dest, { recursive: true })

    for (const file of readDirectory(src)) {
      const srcPath = path.resolve(src, file)
      const destPath = path.resolve(dest, file)

      if (isDirectory(srcPath)) {
        stack.push({ src: srcPath, dest: destPath })
      } else {
        copyFile(srcPath, destPath)
      }
    }
  }
}

scaffold()
  .then(() => console.log(`\n${chalk.bold('Done. Happy Coding!')}`))
  .catch(console.error)
