// List of control types
const osTypes = {
  MS_WIN_10: 'Microsoft Windows 10',
  MAC_OS: 'Apple macOS 10.15'
}

// List of control groups
const MS_10_ENTERPRISE_1909 = 'CIS Microsoft Windows 10 Enterprise (Release 1909)';
const MAC_OS_10_15_BENCHMARK = 'CIS Apple macOS 10.15 Benchmark';

const controlGroups = {
  [osTypes.MS_WIN_10]: MS_10_ENTERPRISE_1909,
  [osTypes.MAC_OS]: MAC_OS_10_15_BENCHMARK,
}

const outputFilenames = {
    [osTypes.MAC_OS]: './dist/macOS_10_15_data_seeder.json',
    [osTypes.MS_WIN_10]: './dist/win10_1909_data_seeder.json',
}

const config = {
  filePath: './data_source/macOS_risk_only.json',

  currentOs: osTypes.MAC_OS,

  currentGroup: null,

  outputFilename: null,

  parseStyle: {
    [osTypes.MS_WIN_10]: {
      riskTitleStyle: {
        fontFaceID: 2,
        fontSize: 19.025,
      },

      headerTitleStyle: {
        fontFaceID: 2,
        fontSize: 22.425,
      },

      subtitleStyle: {
        fontFaceID: 2,
        fontSize: 16.025,
      },

      commandBlockStyle: {
        fontFaceID: 3,
        fontSize: 13.4,
      },
    },

    [osTypes.MAC_OS]: {
      riskTitleStyle: {
        fontFaceID: 2,
        fontSize: 18.96,
      },

      headerTitleStyle: {
        fontFaceID: 2,
        fontSize: 22,
      },

      subtitleStyle: {
        fontFaceID: 2,
        fontSize: 16,
      },

      commandBlockStyle: {
        fontFaceID: 3,
        fontSize: 12.96,
      },
    },
  }
};

config.currentGroup = controlGroups[config.currentOs]
config.outputFilename = outputFilenames[config.currentOs]

module.exports = config;
