import React, { Component } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder
} from 'react-native';
import { Text } from '../custom';
import images from '../../images';

export default class Card extends Component {
  state = {
    opacityAnim: new Animated.Value(0),
    scaleAnim: new Animated.Value(2),
    focused: false,
    pan: new Animated.ValueXY()
  }
  isInDropArea = false;

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        this.setState({ focused: true });
        this.state.opacityAnim.setValue(1);

        Animated.spring(this.state.scaleAnim, {
          toValue: 1.3,
          duration: 50
        }).start();
        typeof this.props.onPressIn === "function" ? this.props.onPressIn() : null;
        if (this.props.location === "hand") {
          this.props.onPickUp();
        }
      },
      onPanResponderMove: this.props.location === "hand"
        ? Animated.event([
          null, { dx: this.state.pan.x, dy: this.state.pan.y }
        ], {
          listener: (e, gestureState) => {
            const { moveX, moveY } = gestureState;

            const { pageX, pageY, width, height } = this.props.dropArea;

            const pageX1 = pageX + width;
            const pageY1 = pageY + height;

            if (
              this.isInDropArea &&
              (moveX < pageX || moveX > pageX1) ||
              (moveY < pageY || moveY > pageY1)
            ) {
              this.isInDropArea = false;
            } else if (
              !this.isInDropArea &&
              (moveX >= pageX && moveX <= pageX1) &&
              (moveY >= pageY && moveY <= pageY1)
            ) {
              this.isInDropArea = true;
            };
          }
        })
        : () => null,
      onPanResponderRelease: () => {
        this.setState({ focused: false });
        Animated.spring(this.state.scaleAnim, {
          toValue: 1,
          duration: 50
        }).start();

        typeof this.props.onPressOut === "function" ? this.props.onPressOut() : null;

        if (this.props.location === "hand") {
          this.props.onDrop(this.isInDropArea);
          this.isInDropArea = false;
        }

        this.state.pan.setValue({ x: 0, y: 0 });
      }
    })
  }

  componentDidMount() {
    Animated.parallel([
      Animated.timing(this.state.scaleAnim, {
        toValue: 1,
        duration: 500
      }),
      Animated.timing(this.state.opacityAnim, {
        toValue: 1,
        duration: 500
      })
    ]).start();
  }
  componentWillUnmount() {
    if (typeof this.props.onPressOut === "function") this.props.onPressOut();
    if (this.props.location === "hand") {
      this.props.onDrop(false);
    }
  }

  get transforms() {
    let transforms = [
      { scale: this.state.scaleAnim },
      ...this.state.pan.getTranslateTransform()
    ];
    if (this.props.style && this.props.style.transform) {
      transforms.push(...this.props.style.transform);
    }

    if (this.state.focused && this.props.location === "hand") {
      transforms.push({ rotateZ: '0deg' });
      transforms.push({
        translateY: this.state.scaleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20]
        }),
      });
    }

    return transforms;
  }

  get imageTransforms() {
    let transforms = [];

    if (this.props.imageStyle && this.props.imageStyle.transform) {
      transforms.push(...this.props.imageStyle.transform);
    }

    if (this.state.focused && this.props.location === "hand") {
      transforms = transforms.filter(t => !t.hasOwnProperty('rotateZ'));
      transforms.push({ rotateZ: '0deg' });
    }

    return transforms;
  }
  render() {
    return (
      <Animated.View
        {...this.panResponder.panHandlers}
        style={{
          ...styles.cardContainer,
          ...(this.props.style || {}),
          ...(this.state.focused > 0 ? { zIndex: 100 } : {}),
          transform: this.transforms,
          opacity: this.state.opacityAnim
        }}
      >
        <Animated.Image
          resizeMode='cover'
          style={{
            ...styles.cardImage, 
            ...(this.props.imageStyle || {}),
            transform: this.imageTransforms
          }}
          source={images.cards[this.props.card.id]}
        />
      </Animated.View>
    )
  }
}

export class CardBack extends Component {
  render() {
    return (
      <View
        style={{
          ...styles.cardContainer,
          borderWidth: 0,
          ...(this.props.style || {})
        }}
      >
        <Image
          resizeMode='stretch'
          style={{...styles.cardImage, ...(this.props.imageStyle || {})}}
          source={images.cardCovers[this.props.faction]}
        />
      </View>
    )
  }
}

export const styles = StyleSheet.create({
  cardContainer: {
    height: 100,
    width: 74,
    position: 'relative'
  },
  cardImage: {
    height: 100,
    width: 74,
    borderWidth: 4,
    borderColor: 'black',
    borderRadius: 6,
    shadowRadius: 6,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 6,
    shadowOffset: { x: 0, y: 0 }
  }
})