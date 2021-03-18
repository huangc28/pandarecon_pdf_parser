// List of control types
const osTypes = {
  MAC_OS: 'Apple macOS 10.15',
  MS_WIN_10: 'Microsoft Windows 10',
  MS_WIN_8_1_WORKSTATION: 'Microsoft Windows 8.1 Workstation',
  MS_OFFICE_WORD_2016: 'Microsoft Office Word 2016',
  MS_WIN_SERVER_2012_R2: 'Microsoft Windows Server 2012 R2',
  MS_WIN_7_WORKSTATION_BENCHMARK_3_2_0_END_OF_LIFE: 'Microsoft Windows 7 Workstation',
}

// List of control groups
const controlGroups = {
  [osTypes.MS_WIN_10]: 'CIS Microsoft Windows 10 Enterprise (Release 1909)',
  [osTypes.MAC_OS]: 'CIS Apple macOS 10.15 Benchmark',
  [osTypes.MS_WIN_8_1_WORKSTATION]: 'CIS Microsoft Windows 8.1 Workstation Benchmark',
  [osTypes.MS_OFFICE_WORD_2016]: 'CIS Microsoft Office Word 2016 Benchmark',
  [osTypes.MS_WIN_SERVER_2012_R2]: 'CIS Microsoft Windows Server 2012 R2 Benchmark',
  [osTypes.MS_WIN_7_WORKSTATION_BENCHMARK_3_2_0_END_OF_LIFE]: 'CIS Microsoft Window 7 Workstation Benchmark',
}

const outputFilenames = {
    [osTypes.MAC_OS]: './dist/macOS_10_15_data_seeder.json',
    [osTypes.MS_WIN_10]: './dist/win10_1909_data_seeder.json',
    [osTypes.MS_WIN_8_1_WORKSTATION]: './dist/ms_8.1_workstation_data_seeder.json',
    [osTypes.MS_OFFICE_WORD_2016]: './dist/ms_office_word_2016_data_seeder.json',
    [osTypes.MS_WIN_SERVER_2012_R2]: './dist/ms_win_server_2012_r2_seeder.json',
    [osTypes.MS_WIN_7_WORKSTATION_BENCHMARK_3_2_0_END_OF_LIFE]: './dist/ms_win_7_workstation_benchmark_3_2_0_end_of_life_seeder.json',
}

const config = {
  filePath: './data_source/CIS_Microsoft_Windows_10_Enterprise_Release_1909_Benchmark_v1.8.1_risk_only.json',

  currentOs: osTypes.MS_WIN_10,

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

    [osTypes.MS_OFFICE_WORD_2016]: {
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
        fontSize: 12,
      }
    },

    [osTypes.MS_WIN_SERVER_2012_R2]: {
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

    [osTypes.MS_WIN_7_WORKSTATION_BENCHMARK_3_2_0_END_OF_LIFE]: {
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
      }

    },
  }
};

config.currentGroup = controlGroups[config.currentOs]
config.outputFilename = outputFilenames[config.currentOs]

module.exports = {
  osTypes,
  config,
}
