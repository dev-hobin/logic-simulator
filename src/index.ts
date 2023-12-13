import { program } from 'commander'

program
  .description('Split a string into substrings and display as an array')
  .argument('[string]', 'string to split')
  .argument('[number]', 'number to split')
  .option('--first', 'display just the first substring')
  .option('-s, --separator <char>', 'separator character', ',')
  .action((str, num, options) => {
    const limit = options.first ? 1 : undefined
    console.log(str?.split(options.separator, limit))
    console.log(num)
  })

program.parse()
