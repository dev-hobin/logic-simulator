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

const init = async () => {
  const argProjectDir = program.processedArgs[0]
  const argTemplate = program.opts<{ template?: Template }>().template

  let result: Answers<'projectName' | 'framework' | 'variant'>
  try {
    result = await prompts(
      [
        {
          type: argProjectDir ? null : 'text',
          name: 'projectName',
          message: 'Project name:',
          initial: 'logic-simulator',
          validate: (v) => (!isValidPath(v) ? 'invalid project name' : true),
        },
        {
          type: argTemplate ? null : 'select',
          name: 'framework',
          message: 'Select a framework',
          initial: 0,
          choices: [
            { title: chalk.yellow('Vanilla'), value: 'vanilla' },
            { title: chalk.blue('React'), value: 'react' },
          ],
        },
        {
          type: argTemplate ? null : 'select',
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
    )
  } catch (cancelled: any) {
    console.log(cancelled.message)
    return
  }

  const [framework, variant] = argTemplate
    ? argTemplate.split('-')
    : [result.framework, result.variant]

  const projectDir = argProjectDir
    ? path.resolve(argProjectDir)
    : path.resolve(result.projectName)

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../../templates',
    `${framework}-${variant}`,
  )

  fs.mkdirSync(projectDir, { recursive: true })

  for (const fileName of readDirectory(templateDir).filter(
    (fileName) => fileName !== 'package.json',
  )) {
    const src = path.join(templateDir, fileName)
    const dest = path.join(projectDir, RENAME_FILES[fileName] ?? fileName)

    if (isDirectory(src)) {
      copyDirectory(src, dest)
    } else {
      copyFile(src, dest)
    }
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8'),
  )
  pkg.name = path.basename(projectDir)
  writeFile(projectDir, 'package.json', JSON.stringify(pkg, null, 2))

  console.log(`\n${chalk.bold('Done. Happy Coding!')}`)
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

init().catch(console.error)
