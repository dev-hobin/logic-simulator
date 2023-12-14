import { program } from 'commander'
import prompts, { type Answers } from 'prompts'
import chalk from 'chalk'

program
  .argument('[projectName]', "project's name")
  .option('--template <template>', 'template to use')
  .parse()

const init = async () => {
  console.log('meta', import.meta.url)
  const projectName = program.processedArgs[0]
  const template = program.opts().template

  let result: Answers<'projectName' | 'framework'>
  try {
    result = await prompts(
      [
        {
          type: 'text',
          name: 'projectName',
          message: 'Project name:',
          initial: 'logic-simulator',
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
  console.log(result)
}

init().catch(console.error)
