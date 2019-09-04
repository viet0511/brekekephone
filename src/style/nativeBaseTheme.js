import merge from 'lodash/merge';
import getTheme from 'native-base/src/theme/components';
import { Platform } from 'react-native';

import variables from './variables';

const nativeBaseTheme = getTheme(variables);

// This recursively update the whole style
// Will be useful for which field we need to update for every components
const recursiveUpdateStyle = o => {
  Object.entries(o).forEach(([k, v]) => {
    if (k.toLowerCase().endsWith('fontfamily')) {
      if (Platform.OS === 'web') {
        o[k] = 'Roboto';
      }
    } else if (k === 'elevation') {
      o[k] = 0; // Remove box shadow on android
    } else if (v && typeof v === 'object') {
      recursiveUpdateStyle(v);
    }
  });
};
recursiveUpdateStyle(nativeBaseTheme);

// Other small/accuracy modifications will be put here
// We should take a look at the default components to see the keys
merge(nativeBaseTheme, {
  'NativeBase.Header': {
    '.noLeft': {
      'NativeBase.Left': {
        width: 0,
        flex: 1,
      },
    },
    '.headerChat': {
      'NativeBase.Left': {
        flex: 0.25,
        paddingLeft: variables.listItemPadding,
        paddingVertical: variables.listItemPadding - 5,
      },
      'NativeBase.Body': {
        'NativeBase.Text': {
          fontWeight: '600',
          fontSize: 18,
        },
        'NativeBase.ViewNB': {
          paddingTop: variables.listItemPadding - 5,
          flexDirection: 'row',
          alignItems: 'center',
        },
        flex: 0.5,
        alignItems: 'flex-start',
        paddingVertical: variables.listItemPadding - 5,
      },
      'NativeBase.Right': {
        flex: 0.25,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: variables.listItemPadding - 5,
      },
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1 / 3,
      height: 80,
    },
    '.search': {
      'NativeBase.Item': {
        'NativeBase.Input': {
          flex: 1,
          paddingVertical: 0,
        },
      },
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f1f1f1',
      // padding: std.gap.lg,
      borderColor: '#e2e2e4',
      // borderBottomWidth: StyleSheet.hairlineWidth,
    },
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomColor: null,
    borderBottomWidth: null,
    backgroundColor: 'white',
  },
  'NativeBase.TabHeading': {
    backgroundColor: 'white',
    '.active': {
      'NativeBase.Text': {
        color: 'black',
      },
    },
    'NativeBase.Text': {
      color: 'gray',
      fontWeight: 'bold',
      fontSize: 11,
    },
    'NativeBase.Bottom': {
      height: 2,
    },
  },
  'NativeBase.Footer': {
    backgroundColor: 'white',
    '.footerChat': {
      'NativeBase.Left': {
        'NativeBase.Button': {
          width: 45,
          height: 45,
        },
        flex: 0.2,
        paddingLeft: variables.listItemPadding,
      },
      'NativeBase.Body': {
        flex: 0.5,
      },
      'NativeBase.Right': {
        flex: 0.3,
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
      justifyContent: 'flex-start',
    },
  },
  'NativeBase.FooterTab': {
    'NativeBase.Button': {
      'NativeBase.Text': {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 9,
        paddingLeft: 0,
        paddingRight: 0,
      },
    },
    backgroundColor: 'white',
  },
  variables: {
    topTabBarActiveBorderColor: '#4cc5de',
  },
  'NativeBase.Badge': {
    '.brekeke': {
      backgroundColor: '#4cc5de',
    },
  },
  'NativeBase.ListItem': {
    '.statusUc': {
      'NativeBase.Left': {},
      'NativeBase.Right': {
        flex: 1,
        justifyContent: 'flex-end',
      },
      borderColor: '#c9c9c9',
      borderWidth: 1 / 3,
      backgroundColor: '#ffffff',
      padding: variables.listItemPadding,
      marginLeft: null,
    },
    '.chat': {
      'NativeBase.Left': {
        flex: 0.2,
      },
      'NativeBase.Body': {
        'NativeBase.ViewNB': {
          'NativeBase.Text': {
            '.note': {
              fontSize: 12,
              paddingLeft: variables.listItemPadding,
              fontWeight: 'normal',
            },
            paddingRight: 10,
            fontSize: 14,
          },
          flexDirection: 'row',
          alignItems: 'center',
        },
        'NativeBase.Text': {
          marginLeft: null,
          paddingTop: 7,
          fontSize: 16,
        },
        flex: 0.8,
        alignSelf: 'flex-start',
        marginLeft: variables.listItemPadding + 5,
      },
    },
    '.listUser': {
      // -> components-Recent/Recents + PageContact
      'NativeBase.Left': {
        flex: 0.25,
      },
      'NativeBase.Body': {
        'NativeBase.ViewNB': {
          'NativeBase.Text': {
            paddingLeft: 5,
          },
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 5,
        },
        'NativeBase.Text': {
          marginLeft: null,
          paddingVertical: 3,
          fontSize: 18,
          fontWeight: '400',
        },
        paddingVertical: variables.listItemPadding + 2,
        marginLeft: variables.listItemPadding + 5,
      },
      'NativeBase.Right': {
        'NativeBase.Button': {
          '.transparent': {
            'NativeBase.Text': {
              fontSize: variables.listNoteSize,
              color: variables.sTabBarActiveTextColor,
            },
          },
          height: null,
          paddingHorizontal: variables.listItemPadding,
        },
        flex: 0.25,
        justifyContent: 'center',
        flexDirection: 'row',
        alignSelf: 'stretch',
        paddingRight: variables.listItemPadding + 5,
        paddingVertical: variables.listItemPadding + 5,
      },
    },
    '.infoUser': {
      // -> components-Recent/Recents + PageContact
      'NativeBase.Left': {
        flex: 0.25,
      },
      'NativeBase.Body': {
        'NativeBase.Text': {
          marginLeft: null,
          paddingVertical: 3,
        },
        marginLeft: variables.listItemPadding + 5,
      },
      'NativeBase.Right': {
        'NativeBase.Button': {
          '.transparent': {
            'NativeBase.Text': {
              fontSize: variables.listNoteSize,
              color: variables.sTabBarActiveTextColor,
            },
          },
          height: null,
        },
        flex: 0.25,
        justifyContent: 'center',
        flexDirection: 'row',
        alignSelf: 'stretch',
        paddingRight: variables.listItemPadding + 5,
      },
      borderBottomWidth: null,
    },
    '.listChat': {
      'NativeBase.Left': {
        flex: 0.25,
      },
      'NativeBase.Body': {
        'NativeBase.Text': {
          marginLeft: null,
          paddingVertical: 3,
        },
        paddingVertical: variables.listItemPadding + 2,
        marginLeft: variables.listItemPadding + 5,
      },
      'NativeBase.Right': {
        'NativeBase.Button': {
          '.transparent': {
            'NativeBase.Text': {
              fontSize: variables.listNoteSize,
              color: variables.sTabBarActiveTextColor,
            },
          },
          height: null,
        },
        flex: 0.4,
        justifyContent: 'center',
        flexDirection: 'row',
        alignSelf: 'stretch',
        paddingRight: variables.listItemPadding + 5,
        paddingVertical: variables.listItemPadding + 5,
      },
    },
    '.callpark': {
      'NativeBase.Left': {
        'NativeBase.Text': {
          alignSelf: 'flex-start',
        },
        flex: 0.5,
        flexDirection: 'column',
      },
      'NativeBase.Right': {
        'NativeBase.Button': {
          '.transparent': {
            'NativeBase.Text': {
              fontSize: variables.listNoteSize,
              color: variables.sTabBarActiveTextColor,
            },
          },
          height: null,
        },
        flex: 0.5,
        justifyContent: 'flex-end',
        flexDirection: 'row',
        alignSelf: 'stretch',
        paddingVertical: variables.listItemPadding + 5,
      },
    },
  },
  'NativeBase.Fab': {
    'NativeBase.Button': {
      backgroundColor: '#74bf53',
    },
  },
  'NativeBase.Left': {
    '.callBar': {
      'NativeBase.Left': {
        'NativeBase.Button': {
          justifyContent: 'center',
          borderRadius: variables.listItemPadding * 4,
          width: variables.listItemPadding * 6,
          height: variables.listItemPadding * 6,
        },
        'NativeBase.Text': {
          paddingTop: variables.listItemPadding,
          fontSize: variables.listItemPadding,
        },
        alignItems: 'center',
        marginHorizontal: variables.listItemPadding,
      },
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: variables.listItemPadding * 2,
      marginLeft: variables.listItemPadding,
      marginRight: variables.listItemPadding,
    },
    '.hangUp': {
      'NativeBase.Left': {
        'NativeBase.Button': {
          justifyContent: 'center',
          borderRadius: variables.listItemPadding * 4,
          width: variables.listItemPadding * 6,
          height: variables.listItemPadding * 6,
        },
        'NativeBase.Text': {
          fontWeight: 'bold',
          paddingTop: variables.listItemPadding,
        },
        alignItems: 'center',
        marginHorizontal: variables.listItemPadding,
      },
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: variables.listItemPadding * 2,
      marginLeft: variables.listItemPadding,
      marginRight: variables.listItemPadding,
    },
    '.leftpd18': {
      marginLeft: variables.listItemPadding + 12,
      marginTop: variables.listItemPadding,
      alignSelf: 'flex-start',
    },
    '.leftmgt15': {
      marginTop: '15%',
    },
    '.lefttop200': {
      top: '200%',
    },
  },
  'NativeBase.ViewNB': {
    '.removeServer': {
      'NativeBase.ViewNB': {
        'NativeBase.Text': {
          padding: variables.listItemPadding,
          fontSize: 18,
          fontWeight: '400',
        },
        'NativeBase.ViewNB': {
          'NativeBase.Button': {
            '.cancel': {
              'NativeBase.Text': {
                fontSize: 14,
                fontWeight: '400',
                color: '#ffffff',
              },
              backgroundColor: '#212121',
              marginRight: variables.listItemPadding,
            },
            '.remove': {
              'NativeBase.Text': {
                fontSize: 14,
                fontWeight: '400',
                color: '#ffffff',
              },
              backgroundColor: '#74bf53',
            },
          },
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginRight: variables.listItemPadding,
          marginTop: variables.listItemPadding,
        },
        backgroundColor: '#ffffff',
        padding: variables.listItemPadding,
      },
      flex: 1,
      justifyContent: 'center',
    },
    '.callModal': {
      'NativeBase.ViewNB': {
        backgroundColor: '#ffffff',
      },
      flex: 1,
      justifyContent: 'flex-end',
    },
    '.av_transfer': {
      'NativeBase.ViewNB': {
        '.center': {
          alignSelf: 'center',
          alignItems: 'center',
          lineHeight: 10,
          'NativeBase.Text': {
            paddingVertical: variables.listItemPadding,
            textAlign: 'center',
          },
        },
        '.btncall': {
          'NativeBase.Button': {
            justifyContent: 'center',
            borderRadius: variables.listItemPadding * 2,
            width: variables.listItemPadding * 4,
            height: variables.listItemPadding * 4,
          },
          'NativeBase.ViewNB': {
            'NativeBase.Text': {
              paddingTop: variables.listItemPadding,
              fontSize: variables.listItemPadding,
              textAlign: 'center',
              alignSelf: 'center',
            },
          },
          marginTop: 100,
        },
        alignItems: 'center',
        marginHorizontal: variables.listItemPadding,
        top: '30%',
      },
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: variables.listItemPadding,
      top: '50%',
    },
    '.center': {
      alignItems: 'center',
    },
  },
});

export default nativeBaseTheme;