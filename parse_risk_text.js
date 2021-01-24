const { extractText, extractTextStyle } = require('./extractors')
const {
  composeContentFromTextChunks,
  removePDFPageText,
} = require('./util')
const config = require('./pandarisk.config')

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
  const descTextChunks = textChunks.slice(apInfo.end_pos + 1)
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

  // The start of "Impact" is the end position of "Remediation".
  const impactChunks = remediationChunks.slice(remediationInfo.rel_end_pos+1)
  const impactInfo = extractImpact(impactChunks)

  // Now we have all information, we can start return all information.
  return {
    control_ref: ref,
    rationale: rationaleInfo.content,
    control_name: ctrlName,
    control_description: descInfo.content,
    pass_value: apInfo.pass_val,
    commands: auditInfo.commands,
    remediation: remediationInfo.content,
    impact: impactInfo.content,
    control_group: config.currentGroup,
    control_type: config.currentOs,
  }
}

/**
 * @TODO Each PDF has different style of subtitle. Thus, font face id
 * and font size should be passed in as arguments to match different
 * PDF subtitle style.
 */
const isSubTitleStyle = textObj => {
  const [fontFaceID, fontSize] = extractTextStyle(textObj)

  const { currentOs, parseStyle } = config
  const { subtitleStyle } = parseStyle[currentOs]


  //return fontFaceID === 2 && fontSize === 16;
  return fontFaceID === subtitleStyle.fontFaceID && fontSize === subtitleStyle.fontSize;
}

const PASS_SCORE_REGEX = /Level%20(\d+).*$/
const REMEDIATION_REGEX = /^R?emediation?(%3A)?$/
const IMPACT_REGEX = /^Impact%3A$/
const COLON_DELIMITER_REGEX = /^.*%3A$/
const NOTE_SUBTITLE_REGEX =  /^Note(%20%23\d)?%3A$/

/**
 * We are using /^.*%3A$/ to find the end position for each subtitle segment.
 * For example:
 *
 *   Profile Applicability:
 *   Description: ---> This is the end position of the "Profile Applicability"
 *   Rationale: ---> This is the end position of the "Description"
 *
 * However, this regex can't differentiate the subtitle we want to exclude from.
 * The following list is what we want to emit.
 */
const exceptionSubtitleRegs = [
  NOTE_SUBTITLE_REGEX,
]

const shouldOmitSubtitle = subtitle => exceptionSubtitleRegs.some(regex => regex.test(subtitle))


function extractProfileApplicability(textChunks) {
  let startPos = 0
  let endPos = 0

  // Iterate through each text element. Try to find line that matches "Profile Applicability".
  // The range is in between "Profile Applicability" and "Description".
  for (let i = 0; i < textChunks.length; i++) {
    // Record the starting position.
    const isDeliminator = COLON_DELIMITER_REGEX.test(extractText(textChunks[i]))

    if (isDeliminator && isSubTitleStyle(textChunks[i])) {
      startPos = i

      break
    }
  }


  for (let k = startPos+1; k < textChunks.length; k++) {
    // Record the ending position.
    const isDeliminator = COLON_DELIMITER_REGEX.test(extractText(textChunks[k]))

    if (isDeliminator && isSubTitleStyle(textChunks[k])) {
      endPos = k - 1

      break
    }
  }

  // After we found start and end positions, we can start composing the string.
  // in this case we can retrieve "pass_value" by matching the subpattern of `Level (1)`.
  // There Might be multiple levels in this slice. We retrieve the largest level here.
  let maxPassVal = 0
  const passValueSlice = textChunks.slice(startPos + 1, endPos + 1)
  const passValueContent = composeContentFromTextChunks(passValueSlice)

  const passValueArr = passValueContent
    .replace(PASS_SCORE_REGEX, '$&|')
    .split('|')

  passValueArr.forEach(s => {
    // Check if the pattern exists in the given string.
    const isPassValueExists = PASS_SCORE_REGEX.test(s)

    if (isPassValueExists) {
      const result = PASS_SCORE_REGEX.exec(s)
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
  for (let i = 1; i < textChunks.length; i++) {
    const isDeliminator = COLON_DELIMITER_REGEX.test(extractText(textChunks[i]))

    if (isDeliminator && isSubTitleStyle(textChunks[i])) {
      const shouldOmit = shouldOmitSubtitle(extractText(textChunks[i]))

      if (shouldOmit) continue;

      endPos = i - 1

      break
    }
  }

  // Now we can compose content for description.
  const descChunks = textChunks.slice(1, endPos)
  const content = composeContentFromTextChunks(descChunks)

  return {
    rel_end_pod: endPos,
    content,
  }
}

function extractRationale(textChunks) {
  let endPos = 0

  for (let i = 1; i < textChunks.length; i++) {
    const isDeliminator = COLON_DELIMITER_REGEX.test(extractText(textChunks[i]))

    if (isDeliminator && isSubTitleStyle(textChunks[i])) {
      const shouldOmit = shouldOmitSubtitle(extractText(textChunks[i]))

      if (shouldOmit) continue;

      endPos = i - 1

      break
    }
  }

  const rationaleChunks = textChunks.slice(1, endPos + 1)

  return {
    rel_end_pos: endPos,
    content: removePDFPageText(composeContentFromTextChunks(rationaleChunks))
  }
}

function extractAuditInfo(textChunks) {
  let endPos = 0

  for (let i = 1; i < textChunks.length; i++) {
    if (REMEDIATION_REGEX.test(extractText(textChunks[i]))) {
      endPos = i - 1

      break
    }
  }

  const auditChunks = textChunks.slice(1, endPos + 1)

  // Try parse "command" and "result" from the edit chunks.
  commands = parseCommandFromAuditTexts(auditChunks)

  return {
    rel_end_pos: endPos,
    commands,
  }
}

/**
 * @TODO
 *   - command text style is different accross PDFs. Thus,
 *     font face id and font size should be passed in as arguments.
 *     to be able to identify command blocks properly.
 *
 *   - There might be multiple command blocks exists in audit section. We need
 *   to be able to identify those
 *
 */
function parseCommandFromAuditTexts(auditChunks) {
  // The command are wrapped in a code block with
  // fontFaceID: 3 and fontSize: 12.96. We can filter
  // out commands by comparing against these values.
  //
  // Note, a audit region may contain multiple code blocks.
  // We assume that the first block is the command code block.
  let commandCodeTexts = []
  const commands = []
  let foundAt = null

  for (let i = 0; i < auditChunks.length; i++) {
    const [fontFaceID, fontSize] = extractTextStyle(auditChunks[i])

    const { currentOs, parseStyle } = config
    const { commandBlockStyle } = parseStyle[currentOs]


    //if (fontFaceID === 3 && fontSize === 12.96) {
    if (fontFaceID === commandBlockStyle.fontFaceID && fontSize === commandBlockStyle.fontSize) {
      if (foundAt === null || i - foundAt === 1) {
        commandCodeTexts.push(auditChunks[i])

        foundAt = i
      }
    } else {
      if (commandCodeTexts.length > 0) {
        // Since the next line is not in command block. The previous command
        // block has completed. We'll flush out the command text from "commandCodeText"
        const commandText = composeContentFromTextChunks(commandCodeTexts)

        commands.push(commandText)


        commandCodeTexts = []
      }

      // The next line is not in the command block,
      // let's match the next line to see if is
      // in the command block.
      foundAt = null;
    }
  }

  return commands
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

  for (let i = 1; i < textChunks.length; i++) {
    const isDeliminator = COLON_DELIMITER_REGEX.test(extractText(textChunks[i]))

    if (isDeliminator && isSubTitleStyle(textChunks[i])) {
      const shouldOmit = shouldOmitSubtitle(extractText(textChunks[i]))

      if (shouldOmit) continue;

      endPos = i - 1

      break
    }
  }

  const impactChunks = textChunks.slice(1, endPos+1)
  const content = composeContentFromTextChunks(impactChunks)

  return {
    rel_end_pos: endPos,
    content,
  }
}

module.exports = parseRiskText
