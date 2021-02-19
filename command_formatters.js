const { format } = require('util')

const HKEY_LOCAL_CMD_REGEX = /^HKEY_LOCAL_MACHINE.*$/

const win10CommandsFormatter = commandArr => {
  // check if the command matches HKEY_LOCAL_CMD_REGEX.
  const fc = commandArr.map(cmd => {
    const isHkeyCmd = HKEY_LOCAL_CMD_REGEX.test(cmd)

    if (!isHkeyCmd) {
      return cmd
    }

    return formatWin10HkeyCommand(cmd)
  })

  return fc
}

/**
 * For win10 1909, the command we extracted is in
 * the following format:
 *
 *```
 *   HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\LDAP:LDAPClientIntegrity
 *```
 *
 * This function would convert the above format into following:
 *
 *```
 *  (Get-ItemProperty 'Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\LDAP' -Name 'LDAPClientIntegrity').'LDAPClientIntegrity'
 *```
 */
const formatWin10HkeyCommand = cmd => {
  let decodedCmd = decodeURIComponent(cmd)

  const [hkey, registryName] = decodedCmd.split(':')

  const fmtCmd = format(
    '(Get-ItemProperty \'Registry::%s\' -Name \'%s\').\'%s\'',
    hkey,
    registryName,
    registryName,
  )

  return fmtCmd
}


// HKEY_USERS\[USER SID]\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer:NoInplaceSha ring
const HKEY_USER_REGISTRY_NAME_REGEX = /^HKEY_USERS\\(.*)$/
const msWin10Server2012CommandsFormatter = commands => {
  const fc = commands.map(cmd => {
    let decodedCmd = decodeURIComponent(cmd)

    const isHkeyCmd = HKEY_USER_REGISTRY_NAME_REGEX.test(decodedCmd)

    if (!isHkeyCmd) {
      return cmd
    }

    return formatMsWin10Server2012Command(decodedCmd)
  })

  return fc
}

// Target format:
//   (Get-ItemPropertyValue 'Registry::HKEY_USERS\[USER SID]\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer' -Name 'NoInplaceSha ring').'NoInplaceSha ring'
const formatMsWin10Server2012Command = cmd => {
  const [hkey, registryName] = cmd.split(':')

  const fmtCmd = format(
    '(Get-ItemPropertyValue \'Registry::%s\' -Name \'%s\').\'%s\'',
    hkey,
    registryName,
    registryName,
  )

  return fmtCmd
}

// commands on MS office document comes with the following format:
//
//   HKEY_USERS\<SID>\software\policies\microsoft\office\16.0\common\research\translationCriteria
//
// The real executable format on a windows station would be:
//
// ref format: Get-ItemPropertyValue 'Registry::HKEY_USERS\.DEFAULT\Control Panel\Colors'
//
//   Get-ItemPropertyValue 'Registry::HKEY_USERS\<SID>\software\policies\microsoft\office\16.0\common\research\translationCriteria'
const SID_REGEX = /<SID>/g

const msOfficeWord2016CommandsFormatter = cmdArr => {
  // Check if the given command matches HKEY_REGISTRY_NAME
  const fc = cmdArr.map(cmd => {
    const decodedCmd = decodeURIComponent(cmd)

    const isHkeyCmd = HKEY_USER_REGISTRY_NAME_REGEX.test(decodedCmd)

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
  msWin10Server2012CommandsFormatter,
  win10CommandsFormatter,
}
