import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import globalStyles from '../styles';
import Text from './Text';

export default class AppButton extends Component {
  state = {
    activePress: false,
    sounds: null
  }
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    let buttonPress = new Audio.Sound();
    let buttonRelease = new Audio.Sound();

    /* load the button sounds synchronously within an anonymous async function */
    // this prevents us from making the 'componentDidMount' function async,
    // which can cause memory leaks
    (async () => {
      await buttonPress.loadAsync(require('../../assets/audio/ui/buttonpress.mp3'));
      await buttonRelease.loadAsync(require('../../assets/audio/ui/buttonrelease.mp3'));
      this.setState({ sounds: { buttonPress, buttonRelease } });
    })();
  }
  render() {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={this.props.onPress}
        onPressIn={() => {
          if (this.state.sounds) {
            this.state.sounds.buttonPress.playFromPositionAsync(5);
          }
          this.setState({ activePress: true });
        }}
        onPressOut={() => {
          if (this.state.sounds) {
            this.state.sounds.buttonRelease.playFromPositionAsync(15);
          }
          this.setState({ activePress: false });
        }}
        style={{
          position: 'relative',
          borderRadius: 6,
          borderColor: '#BDA753',
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
            !this.state.activePress
              ? ['#DBC25E', '#A89548']
              : ['#A89548', '#DBC25E']
          }
          style={{...globalStyles.absoluteCenter}}
        />
        <Text bold style={this.props.textStyle}>{this.props.title}</Text>
      </TouchableOpacity>
    )
  }
}