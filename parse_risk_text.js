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
//   title: 'some title',
//   text_chunks: [textObj, textObj]
// }
//
// The structure of text obj is provided by the "pdf2json"
//
function parseRiskText(textObj) {
  const { text_chunks: textChunks } = textObj

  const apInfo = extractProfileApplicability(textObj)

  // The start position of "Description" is the end position of "Profile Applicability" plus 1.
  const descTextChunks = textChunks.slice(apInfo.end_pos+1)
  const descInfo = extractDescInfo(descTextChunks)

  // The start of "Rationale" is the end position of "Description".
  const rationaleChunks = textChunks.slice(apInfo.end_pos+1 + descInfo.rel_end_pod+1)
  const rationaleInfo = extractRationale(rationaleChunks)

  // The start of "Audit" is the end position of "Rationale".
  const auditChunks = rationaleChunks.slice(rationaleInfo.rel_end_pos+1)
  const auditInfo = extractAuditInfo(auditChunks)

  // The start of "Remediation" is the end position of "Audit".
  const remediationChunks = auditChunks.slice(auditInfo.rel_end_pos+1)
  const remediationInfo = extractRemediation(remediationChunks)
}

const PROFILE_APPLICABILITY_REGEX = /^Profile%20Applicability%3A$/
const DESCRIPTION_REGEX = /^Description%3A$/
const PASS_SCORE_REGEX = /^Level%20(\d+)$/
const RATIONALE_REGEX = /^Rationale%3A$/

function extractProfileApplicability(textObj) {
  const {
    text_chunks: textChunks,
  } = textObj

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

    // Record the ending position.
    const isDesc = DESCRIPTION_REGEX.test(extractText(textChunks[i]))

    if (isDesc) {
      endPos = i - 1

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
  //Find text range before "Rationale:"
  let endPos = 0

  for (let i = 0; i < textChunks.length; i++) {
    const isRationale = RATIONALE_REGEX.test(extractText(textChunks[i]))

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

const AUDIT_REGEX = /^Audit%3A$/
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

const REMEDIATION_REGEX = /^Remediation%3A$/
function extractAuditInfo(textChunks) {
  let endPos = 0

  for (let i = 0; i < textChunks.length; i++) {
    if (REMEDIATION_REGEX.test(extractText(textChunks[i]))) {
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
  // out commands by comparing these values.
  const commandChunks = auditChunks.filter(chunk => {
    const [fontFaceID, fontSize] = extractTextStyle(chunk)

    return fontFaceID === 3 && fontSize === 12.96
  })

  return composeContentFromTextChunks(commandChunks)
}

const IMPACT_REGEX = /^Impact%3A$/
function extractRemediation() {


}

function composeContentFromTextChunks (textChunks) {
  return textChunks.reduce((content, chunk) => {
    content += extractText(chunk)

    return content
  }, '')
}

module.exports = parseRiskText
