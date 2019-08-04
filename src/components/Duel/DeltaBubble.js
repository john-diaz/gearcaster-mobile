import React, { Component } from 'react';
import { View, Animated } from 'react-native';
import { Text } from '../custom';

export default class DeltaBubble extends Component {
  _ismounted = false;
  animation = new Animated.Value(0);

  componentDidMount() {
    this._ismounted = true;

    Animated.timing(this.animation, {
      toValue: 1,
      duration: 100
    }).start(() => {
      if (!this._ismounted) return;

      Animated.timing(this.animation, {
        toValue: 0,
        duration: 100,
        delay: 700
      }).start();
    });
  }
  componentWillUnmount() {
    this._ismounted = false;
  }
  render() {
    const { delta } = this.props;

    return (
      <Animated.View
        style={{
          height: 24,
          width: 24,
          borderRadius: 24,
          position: 'absolute',
          right: this.animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -25]
          }),
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: delta > 0 ? 'green' : 'red',
          opacity: this.animation,
          ...this.props.style
        }}
      >
        <Text
          bold
          style={{ fontSize: 12 }}
        >{delta > 0 ? '+' : ''}{delta}</Text>
      </Animated.View>
    )
  }
}