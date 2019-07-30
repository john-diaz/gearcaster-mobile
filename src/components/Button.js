import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import globalStyles from '../styles';
import Text from './Text';

let buttonPress = new Audio.Sound();
let buttonRelease = new Audio.Sound();
buttonPress.loadAsync(require('../../assets/audio/ui/buttonpress.mp3'));
buttonRelease.loadAsync(require('../../assets/audio/ui/buttonrelease.mp3'));

export default class AppButton extends Component {
  state = {
    activePress: false
  }
  render() {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={this.props.onPress}
        onPressIn={() => {
          buttonPress.playFromPositionAsync(0);
          this.setState({ activePress: true });
        }}
        onPressOut={() => {
          buttonRelease.playFromPositionAsync(0);
          this.setState({ activePress: false });
        }}
        style={{
          position: 'relative',
          borderRadius: 6,
          borderColor: !this.props.urgent ? '#BDA753' : '#bd7153',
          borderWidth: 2,
          paddingVertical: 10,
          paddingHorizontal: 15,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: 'white',
          shadowRadius: 6,
          shadowOpacity: 0.8,
          ...this.props.style
        }}

      >
        <LinearGradient
          colors={
            !this.props.urgent
              ? !this.state.activePress
                ? ['#DBC25E', '#A89548']
                : ['#A89548', '#DBC25E']
              : !this.state.activePress
                ? ['#db775e', '#a84e48']
                : ['#a84e48', '#db775e']
          }
          style={{...globalStyles.absoluteCenter}}
        />
        <Text bold style={this.props.textStyle}>{this.props.title}</Text>
      </TouchableOpacity>
    )
  }
}