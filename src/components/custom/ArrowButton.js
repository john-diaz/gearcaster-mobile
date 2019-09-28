import React, { PureComponent } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Image
} from 'react-native';
import { Audio } from 'expo-av';

export default class ArrowButton extends PureComponent {
  state = {
    activePress: false
  }
  get rotateZ() {
    const { direction } = this.props;

    if (direction === 'right') {
      return '180deg';
    }

    if (direction === 'up') {
      return '90deg';
    }

    if (direction === 'down') {
      return '-90deg';
    }

    return '0deg'
  }
  render() {
    return (
      <TouchableWithoutFeedback
        onPress={this.props.onPress}
        onPressIn={() => {
          if (!this.props.onPress) return;

          let buttonPress = new Audio.Sound();
          buttonPress.loadAsync(require('../../../assets/audio/ui/buttonpress.mp3'), { shouldPlay: true });
          this.setState({ activePress: true });

          if (this.props.onPressIn) this.props.onPressIn();
        }}
        onPressOut={() => {
          if (!this.props.onPress) return;

          let buttonRelease = new Audio.Sound();
          buttonRelease.loadAsync(require('../../../assets/audio/ui/buttonrelease.mp3'), { shouldPlay: true });
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
              { rotateZ: this.rotateZ }
            ],
            ...this.props.style
          }}
        />
      </TouchableWithoutFeedback>
    )
  }
}