import React, { Component } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Image
} from 'react-native';
import { Audio } from 'expo-av';

export default class ArrowButton extends Component {
  state = {
    activePress: false
  }

  buttonPress = new Audio.Sound();
  buttonRelease = new Audio.Sound();
  componentDidMount() {
    this.buttonPress.loadAsync(require('../../../assets/audio/ui/buttonpress.mp3'));
    this.buttonRelease.loadAsync(require('../../../assets/audio/ui/buttonrelease.mp3'));
  }
  render() {
    return (
      <TouchableWithoutFeedback
        onPress={this.props.onPress}
        onPressIn={() => {
          this.buttonPress.playFromPositionAsync(0);
          this.setState({ activePress: true });

          if (this.props.onPressIn) this.props.onPressIn();
        }}
        onPressOut={() => {
          this.buttonRelease.playFromPositionAsync(0);
          this.setState({ activePress: false });

          if (this.props.onPressOut) this.props.onPressOut();
        }}
      >
        <Image
          source={require('../../../assets/img/ui/icons/arrow.png')}
          resizeMode='stretch'
          style={{
            transform: [
              { rotateX: this.state.activePress ? '180deg' : '0deg' },
              { rotateY: this.props.direction === 'right' ? '180deg' : '0deg' }
            ],
            ...this.props.style
          }}
        />
      </TouchableWithoutFeedback>
    )
  }
}