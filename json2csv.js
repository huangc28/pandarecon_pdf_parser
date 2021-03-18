const { createReadStream, createWriteStream } = require('fs')
const { AsyncParser } = require('json2csv')
const { config, osTypes } = require('./pandarisk.config')

const sourcePath = config.outputFilename

const targetPaths = {
  [osTypes.MS_WIN_10]: './result_csvs/win10_1909_data_seeder.csv',
  [osTypes.MS_WIN_8_1_WORKSTATION]: './result_csvs/ms_8.1_workstation_data_seeder.csv',
  [osTypes.MS_OFFICE_WORD_2016]: './result_csvs/ms_office_word_2016_data_seeder.csv',
  [osTypes.MS_WIN_SERVER_2012_R2]: './result_csvs/ms_win_server_2012_r2_seeder.csv',
  [osTypes.MS_WIN_7_WORKSTATION_BENCHMARK_3_2_0_END_OF_LIFE]: './result_csvs/ms_win_7_workstation_benchmark_3_2_0_end_of_life_seeder.csv'
}

const targetPath = targetPaths[config.currentOs]

function decodeURIData (item) {
  const cobj = Object.keys(item)
    .reduce((accu, curr) => {
      accu[curr] = decodeURIComponent(item[curr])

      return accu
    }, {})


  return cobj
}

function implodeCommands(item) {
  if (Array.isArray(item.commands) && item.commands.length > 0) {
    const implodedCommands = item.commands.join(',')

    return {
      ...item,
      commands: implodedCommands,
    }
  }

  return item
}

const fields = [
  'control_ref',
  'rationale',
  'control_name',
  'control_description',
  'pass_value',
  'commands',
  'remediation',
  'impact',
  'control_group',
  'control_type',
]

const opts = {
  fields,
  transforms: [
    decodeURIData,
    implodeCommands,
  ],
}

const transformOpts = { highWaterMark: 8192 }

const input = createReadStream(
  sourcePath,
  { encoding: 'utf8' },
)

const output = createWriteStream(
  targetPath,
  { encoding: 'utf8' },
)

const asyncParser = new AsyncParser(opts, transformOpts)
const parsingProcessor = asyncParser
  .fromInput(input)
  .toOutput(output)

//parsingProcessor.processor
  //.on('end', () => console.log('done converting to csv'))

parsingProcessor.promise()
  .then(csv => console.log('DEBUG csv', csv))
  .catch(err => console.error('DEBUG', err))
