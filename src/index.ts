import { program, InvalidArgumentError } from 'commander'
import prompts, { type Answers } from 'prompts'
import chalk from 'chalk'
import path from 'node:path'

type TEMPLATE = 'vanilla-js' | 'vanilla-ts' | 'react-ts' | 'react-js'

const isValidPath = (p: string) => !path.dirname(path.resolve(p)).includes('.')

const validatePath = (p: string | undefined) => {
  if (p === undefined || isValidPath(p)) return p
  throw new InvalidArgumentError('invalid path')
}

program
  .argument('[projectDir]', 'project root directory', validatePath)
  .option('--template <template>', 'template to use')
  .parse()

const init = async () => {
  const argProjectDir = program.processedArgs[0]
  const argTemplate = program.opts<{ template?: TEMPLATE }>().template

  let result: Answers<'projectName' | 'framework'>
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
          type: 'select',
          name: 'framework',
          message: 'Select a framework',
          initial: 0,
          choices: [
            { title: chalk.yellowBright('Vanilla'), value: 'vanilla' },
            { title: chalk.blueBright('React'), value: 'react' },
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
}

init().catch(console.error)
