// List of control types
const osTypes = {
  MS_WIN_10: 'Microsoft Windows 10',
  MAC_OS: 'Apple macOS 10.15',
  MS_WIN_8_1_WORKSTATION: 'Microsoft Windows 8.1 Workstation',
}

// List of control groups
const controlGroups = {
  [osTypes.MS_WIN_10]: 'CIS Microsoft Windows 10 Enterprise (Release 1909)',
  [osTypes.MAC_OS]: 'CIS Apple macOS 10.15 Benchmark',
  [osTypes.MS_WIN_8_1_WORKSTATION]: 'CIS Microsoft Windows 8.1 Workstation Benchmark',
}

const outputFilenames = {
    [osTypes.MAC_OS]: './dist/macOS_10_15_data_seeder.json',
    [osTypes.MS_WIN_10]: './dist/win10_1909_data_seeder.json',
    [osTypes.MS_WIN_8_1_WORKSTATION]: './dist/ms_8.1_workstation_data_seeder.json',
}

const config = {
  filePath: './data_source/CIS_Microsoft_Windows_8.1_Workstation_Benchmark_v2.4.0_risk_only.json',

  currentOs: osTypes.MS_WIN_8_1_WORKSTATION,

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
      headerTitleStyle: {
        fontFaceID: 2,
        fontSize: 22,
      },

      riskTitleStyle: {
        fontFaceID: 2,
        fontSize: 18.96,
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

    [osTypes.MS_WIN_8_1_WORKSTATION]: {
      headerTitleStyle: {
        fontFaceID: 2,
        fontSize: 22.425,
      },

      riskTitleStyle: {
        fontFaceID: 2,
        fontSize: 19.025,
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
  }
};

config.currentGroup = controlGroups[config.currentOs]
config.outputFilename = outputFilenames[config.currentOs]

module.exports = config;
