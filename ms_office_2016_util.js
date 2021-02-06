// commands on MS office document comes with the following format:
//
//   HKEY_USERS\<SID>\software\policies\microsoft\office\16.0\common\research\translationCriteria
//
// The real executable format on a windows station would be:
//
// ref format: Get-ItemPropertyValue 'Registry::HKEY_USERS\.DEFAULT\Control Panel\Colors'
//
//   Get-ItemPropertyValue 'Registry::HKEY_USERS\<SID>\software\policies\microsoft\office\16.0\common\research\translationCriteria'

const { format } = require('util')

const HKEY_REGISTRY_NAME_REGEX = /^HKEY_USERS\\(.*)$/
const SID_REGEX = /<SID>/g

const msOfficeWord2016CommandsFormatter = cmdArr => {
  // Check if the given command matches HKEY_REGISTRY_NAME
  const fc = cmdArr.map(cmd => {
    const decodedCmd = decodeURIComponent(cmd)

    const isHkeyCmd = HKEY_REGISTRY_NAME_REGEX.test(decodedCmd)

    if (isHkeyCmd) {
      return formatHkeyUsersCommand(decodedCmd)
    }

    return decodedCmd
  })

  return fc

}

const formatHkeyUsersCommand = cmd => {
  const fmtCmd = format(
    'Get-ItemPropertyValue \'Registry::%s\'',
    cmd,
  )

  // replace SID with placeholder {SID}
  const placeholderCmd = fmtCmd.replace(SID_REGEX, '{SID}')

  return placeholderCmd
}

module.exports = {
  msOfficeWord2016CommandsFormatter,
}
