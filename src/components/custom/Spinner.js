import React, { PureComponent } from 'react';
import { Animated, Easing } from 'react-native';

export default class Spinner extends PureComponent {
  spinValue = new Animated.Value(0);

  state = {
    spinning: false
  };

  componentDidMount() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.spinValue, {
          toValue: 1,
          duration: 500,
          delay: 0,
          easing: Easing.linear
        })
      ]),
      {
        iterations: Infinity
      }
    ).start();
  }
  render() {
    return (
      <Animated.Image
        source={require('../../../assets/img/ui/icons/gear.png')}
        style={{
          height: 32,
          width: 32,
          transform: [{
            rotate: this.spinValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '60deg'],
            })
          }],
        }}
      />
    )
  }
}