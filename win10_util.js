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

module.exports = {
  win10CommandsFormatter,
}

