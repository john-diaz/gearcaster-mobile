import React, { Component } from 'react';
import { View, ImageBackground } from 'react-native';

export default class Duel extends Component {
  render() {
    return (
      <ImageBackground
        source={require('../../assets/img/backgrounds/clouds.png')}
        style={{
          flex: 1,
          width: '100%',
          height: '100%'
        }}
      >
      </ImageBackground>
    )
  }
}