const { extractText, extractTextStyle } = require('./extractors')

// This function extracts the information we need from risk chunk.
// It analyzes the text chunks for each risk and try to parse the following
// data out:
//   - Profile Applicability
//   - Description
//   - Rationale
//   - Audit, includes command and result
//   - Remediation
//   - Impact
//
// The strcuture of the risk chunk is as follow:
//
// {
//   ref: '',
//   ctrl_name: '',
//   score_status: '',
//   start_pos: '',
//   end_pos: '',
//   text_chunks: [textObj, textObj]
// }
//
// The structure of text obj is provided by the "pdf2json"
//
// We can actually use regex subpattern to grab content within two titles.
// For example:
//
//   Description:
//
function parseRiskText(textObj) {
  const {
    ref,
    ctrl_name: ctrlName,
    text_chunks: textChunks,
  } = textObj

  const apInfo = extractProfileApplicability(textChunks)

  // The start position of "Description" is the end position of "Profile Applicability" plus 1.
  const descTextChunks = textChunks.slice(apInfo.end_pos+1)
  const descInfo = extractDescInfo(descTextChunks)

  // The start of "Rationale" is the end position of "Description".
  const rationaleChunks = textChunks.slice(apInfo.end_pos+1 + descInfo.rel_end_pod+1)
  const rationaleInfo = extractRationale(rationaleChunks)

  // The start of "Audit" is the end position of "Rationale".
  const auditChunks = rationaleChunks.slice(rationaleInfo.rel_end_pos+1)
  const auditInfo = extractAuditInfo(auditChunks)

  //console.log('DEBUG spot 1 ', auditInfo)

  // The start of "Remediation" is the end position of "Audit".
  const remediationChunks = auditChunks.slice(auditInfo.rel_end_pos+1)
  const remediationInfo = extractRemediation(remediationChunks)

  // The start of "Impact" is the end position of "Remediation".
  const impactChunks = remediationChunks.slice(remediationInfo.rel_end_pos+1)
  const impactInfo = extractImpact(impactChunks)


  // Now we have all information, we can start return all information.
  return {
    control_ref: ref,
    control_name: ctrlName,
    pass_value: apInfo.pass_val,
    control_description: descInfo.content,
    command: auditInfo.command,
    remediation: remediationInfo.content,
    impact: impactInfo.content,
  }
}

const PROFILE_APPLICABILITY_REGEX = /^Profile%20Applicability%3A$/
const DESCRIPTION_REGEX = /^Description%3A$/
const PASS_SCORE_REGEX = /^Level%20(\d+)$/
const AUDIT_REGEX = /^Audit%3A$/
const REMEDIATION_REGEX = /^R?emediation?(%3A)?$/
const IMPACT_REGEX = /^Impact%3A$/
const CIS_CONTROL_REGEX = /^CIS(%20Controls%3A)?$/

const SEGMENT_DELIMITER_REGEX = /^(Profile%20Applicability%3A|Description%3A|Rationale%3A|Audit%3A|Remediation%3A|Impact%3A|CIS%20Controls%3A)$/
const COLON_DELIMITER_REGEX = /^.*%3A$/

function extractProfileApplicability(textChunks) {
  let startPos = 0
  let endPos = 0

  // Iterate through each text element. Try to find line that matches "Profile Applicability".
  // The range is in between "Profile Applicability" and "Description".
  for (let i = 0; i < textChunks.length; i++) {
    // Record the starting position.
    const isPA = PROFILE_APPLICABILITY_REGEX.test(extractText(textChunks[i]))

    if (isPA) {
      startPos = i

      continue
    }

  }


  for (let k = startPos+1; k < textChunks.length; k++) {
    // Record the ending position.
    const isDeliminator = COLON_DELIMITER_REGEX.test(extractText(textChunks[k+1]))

    if (isDeliminator) {
      endPos = k

      break
    }
  }

  // After we found start and end positions, we can start composing the string.
  // in this case we can retrieve "pass_value" by matching the subpattern of `Level (1)`.
  // There Might be multiple levels in this slice. We retrieve the largest level here.
  let maxPassVal = 0
  const passValueSlice = textChunks.slice(startPos + 1, endPos + 1)

  passValueSlice.forEach(s => {
    // Check if the pattern exists in the given string.
    const isPassValueExists = PASS_SCORE_REGEX.test(extractText(s))

    if (isPassValueExists) {
      const result = PASS_SCORE_REGEX.exec(extractText(s))
      const [, passVal] = result
      const intPassVal = parseInt(passVal)

      if (intPassVal > maxPassVal) {
        maxPassVal = intPassVal
      }
    }
  })

  // Returns start_pos, end_pos, and pass_value
  return {
    start_pos: startPos,
    end_pos: endPos,
    pass_val: maxPassVal,
  }
}

function extractDescInfo(textChunks) {
  // Find text range before "Rationale:"
  let endPos = 0
  //console.log('extractDescInfo spot 1', extractText(textChunks[0]))
  for (let i = 1; i < textChunks.length; i++) {
    const isRationale = SEGMENT_DELIMITER_REGEX.test(extractText(textChunks[i]))

    if (isRationale) {
      endPos = i - 1

      break
    }
  }

  // Now we can compose content for description.
  const descChunks = textChunks.slice(1, endPos + 1)
  const content = composeContentFromTextChunks(descChunks)

  return {
    rel_end_pod: endPos,
    content,
  }
}

function extractRationale(textChunks) {
  let endPos = 0

  for (let i = 0; i < textChunks.length; i++) {
    if (AUDIT_REGEX.test(extractText(textChunks[i]))) {
      endPos = i - 1

      break
    }
  }

  const rationaleChunks = textChunks.slice(1, endPos + 1)

  return {
    rel_end_pos: endPos,
    content:composeContentFromTextChunks(rationaleChunks)
  }
}

function extractAuditInfo(textChunks) {
  let endPos = 0

  console.log('extractAuditInfo spot 1', extractText(textChunks[0]))
  for (let i = 1; i < textChunks.length; i++) {
    if (REMEDIATION_REGEX.test(extractText(textChunks[i]))) {

      console.log('extractAuditInfo spot 2', i)
      endPos = i - 1

      break
    }
  }

  const auditChunks = textChunks.slice(1, endPos + 1)
  // Try parse "command" and "result" from the edit chunks.
  command = parseCommandFromAuditTexts(auditChunks)

  return {
    rel_end_pos: endPos,
    command,
  }
}

function parseCommandFromAuditTexts(auditChunks) {
  // The command are wrapped in a code block with
  // fontFaceID: 3 and fontSize: 12.96. We can filter
  // out commands by comparing against these values.
  //
  // Note, a audit region may contain multiple code blocks.
  // We assume that the first block is the command code block.

  const commandCodeTexts = []
  let foundAt = null

  for (let i = 0; i < auditChunks.length; i++) {
    const [fontFaceID, fontSize] = extractTextStyle(auditChunks[i])

    if (fontFaceID === 3 && fontSize === 12.96) {
      if (foundAt === null || i - foundAt === 1) {
        commandCodeTexts.push(auditChunks[i])

        foundAt = i

        continue
      }

      if (i - foundAt > 1) {
        break
      }
    }
  }

  return composeContentFromTextChunks(commandCodeTexts)
}

function extractRemediation(textChunks) {
  let endPos = 0

  for (let i = 0; i < textChunks.length; i++) {
    if (IMPACT_REGEX.test(extractText(textChunks[i]))) {
      endPos = i - 1

      break
    }
  }

  const remediationChunk = textChunks.slice(1, endPos + 1)
  const content = composeContentFromTextChunks(remediationChunk)

  return {
    rel_end_pos: endPos,
    content,
  }
}

function extractImpact(textChunks) {
  let endPos = 0

  for (let i = 0; i < textChunks.length; i++) {
    if (CIS_CONTROL_REGEX.test(extractText(textChunks[i]))) {
      endPos = i - 1

      break;
    }
  }

  const impactChunks = textChunks.slice(1, endPos+1)
  const content = composeContentFromTextChunks(impactChunks)

  return {
    rel_end_pos: endPos,
    content,
  }
}

function composeContentFromTextChunks (textChunks) {
  return textChunks.reduce((content, chunk) => {
    content += extractText(chunk)

    return content
  }, '')
}

module.exports = parseRiskText
