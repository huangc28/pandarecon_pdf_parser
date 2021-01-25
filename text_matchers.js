const { extractTextStyle } = require('./extractors')
const pandaRiskConfg = require('./pandarisk.config')

const { currentOs, parseStyle } = pandaRiskConfg
const {
  riskTitleStyle,
  headerTitleStyle,
  subtitleStyle,
  commandBlockStyle,
} = parseStyle[currentOs]

const isRiskTitle = textObj => {
  // determine if is text title via text style.
  const [fontFaceID, fontSize] = extractTextStyle(textObj)

  return fontFaceID === riskTitleStyle.fontFaceID && fontSize === riskTitleStyle.fontSize
}

const isHeaderTitle = textObj => {
  const [fontFaceID, fontSize] = extractTextStyle(textObj)

  return fontFaceID === headerTitleStyle.fontFaceID && fontSize === headerTitleStyle.fontSize
}

const isSubTitleStyle = textObj => {
  const [fontFaceID, fontSize] = extractTextStyle(textObj)

  return fontFaceID === subtitleStyle.fontFaceID && fontSize === subtitleStyle.fontSize;
}

const isCommandBlockStyle = textObj => {
  const [fontFaceID, fontSize] = extractTextStyle(textObj)

  return fontFaceID === commandBlockStyle.fontFaceID && fontSize ===  commandBlockStyle.fontSize
}

module.exports = {
  isRiskTitle,
  isHeaderTitle,
  isSubTitleStyle,
  isCommandBlockStyle,
}
