import React, { Component } from 'react';
import { View } from 'react-native';
import globalStyles from '../../styles';

export default class Sidebar extends Component {
  render() {
    return (
      <View
        style={{
          width: 50,
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: -30,
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <View
          style={{
            ...globalStyles.fadedCobblebox,
            height: 28,
            marginBottom: 18
          }}
        >

        </View>
        <View
          style={{
            // ...globalStyles.fadedCobblebox,
            flex: 1,
            maxHeight: 265
          }}
        >

        </View>
      </View>
    )
  }
}