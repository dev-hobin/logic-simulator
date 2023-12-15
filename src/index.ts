import {
  program,
  InvalidArgumentError,
  InvalidOptionArgumentError,
} from 'commander'
import prompts, { type Answers } from 'prompts'
import chalk from 'chalk'
import path from 'node:path'

type Framework = 'react' | 'vanilla'
type Variant = 'js' | 'ts'
type Template = `${Framework}-${Variant}`

const FRAMEWORKS: Framework[] = ['vanilla', 'react']
const VARIANTS: Variant[] = ['js', 'ts']

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

  const projectDir = argProjectDir
    ? path.resolve(argProjectDir)
    : path.resolve(result.projectName)

  const [framework, variant] = argTemplate
    ? argTemplate.split('-')
    : [result.framework, result.variant]

  console.log({ projectName: path.basename(projectDir), framework, variant })
}

init().catch(console.error)
