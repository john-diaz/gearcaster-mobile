import React, { Component } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Animated,
  PanResponder
} from 'react-native';
import { Text } from '../custom';
import images from '../../images';
import CardInfo from './CardInfo';
import { hasEnoughResources, getRarityColor } from '../../helpers';
import { Audio } from 'expo-av';
import { Entypo } from '@expo/vector-icons';
import globalStyles from '../../styles';
import DeltaBubble from './DeltaBubble';

export default class Card extends Component {
  _ismounted = false;
  state = {
    opacityAnim: new Animated.Value(0),
    scaleAnim: new Animated.Value(2),
    focused: false,
    pan: new Animated.ValueXY(),
    descriptionAnim: new Animated.Value(0),
    aggroAnim: new Animated.Value(0),

    strengthDelta: null
  }
  isInDropArea = false;
  cardDealAudio = new Audio.Sound();

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
        Animated.spring(this.state.descriptionAnim, {
          toValue: 1,
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
        Animated.spring(this.state.descriptionAnim, {
          toValue: 0,
          duration: 50
        }).start();

        typeof this.props.onPressOut === "function" ? this.props.onPressOut() : null;

        if (this.props.location === "hand") {
          this.props.onDrop(this.isInDropArea, this.hasEnough);
          this.isInDropArea = false;
        }

        this.state.pan.setValue({ x: 0, y: 0 });
      }
    })
  }

  componentDidMount() {
    this._ismounted = true;

    const { location } = this.props;

    if (location !== "hand" && location !== "bench") {
      this.cardDealAudio.loadAsync(
        this.props.isActiveDiscovery
          ? require('../../../assets/audio/ui/discoverycast.mp3')
          : require('../../../assets/audio/ui/carddeal.mp3')
      )
      .then(() => {
        this.cardDealAudio.playAsync();
      });
    }

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

    if (this.props.isActiveDiscovery) {
      // animate the discovery card leaving in 4 seconds
      setTimeout(() => {
        if (!this._ismounted) return;
        Animated.timing(this.state.opacityAnim, {
          toValue: 0,
          duration: 250
        }).start();
      }, 4250);
    }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.isAggro !== this.props.isAggro && this.props.isAggro) {
      Animated.timing(this.state.aggroAnim, {
        toValue: 1,
        duration: 100
      }).start(() => {
        if (!this._ismounted) return;

        Animated.timing(this.state.aggroAnim, {
          toValue: 0,
          duration: 100,
          delay: 1200
        }).start();
      });
    }
    else if (prevProps.card.attributes.strength !== this.props.card.attributes.strength) {
      if (this._strengthInterval) clearTimeout(this._strengthInterval);

      // strength display
      this.setState({
        strengthDelta: this.props.card.attributes.strength - prevProps.card.attributes.strength
      });
      this._strengthInterval = setTimeout(() => {
        if (!this._ismounted) return;
        this.setState({ strengthDelta: null });
      }, 950);
    }
  }
  componentWillUnmount() {
    this._ismounted = false;
    if (typeof this.props.onPressOut === "function") this.props.onPressOut();
    if (this.props.location === "hand") {
      this.props.onDrop(false, false);
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

  get hasEnough() {
    const { card, user, location, isActiveDiscovery } = this.props;

    if (
      isActiveDiscovery ||
      location === 'bench' ||
      location === 'bench-opponent'
    ) return true;

    return hasEnoughResources(user.resources, card.attributes.castCost);
  }
  render() {
    const { card, location, isAggro } = this.props;
    const { aggroAnim, opacityAnim, focused, strengthDelta } = this.state;

    return (
      <Animated.View
        {...this.panResponder.panHandlers}
        style={{
          ...styles.cardContainer,
          ...(this.props.style || {}),
          ...(focused > 0 ? { zIndex: 100 } : {}),
          transform: this.transforms,
          opacity: opacityAnim,
          ...(this.props.isActiveDiscovery ? { // this card is an active discovery
            position: 'absolute',
            left: 50,
            top: opacityAnim.interpolate({ // animate active discovery
              inputRange: [0, 1],
              outputRange: [-100, 100]
            }),
            shadowRadius: 6,
            shadowOpacity: 0.7
          } : {}),
          ...(isAggro ? { // aggro animations
            top: aggroAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, location == 'bench-opponent' ? 20 : -20],
            }),
            shadowColor: 'rgb(255, 0, 0)',
            zIndex: 100
          } : {}),
        }}
      >
        {/* CARD INFO */}
        { focused 
            ? <CardInfo
              card={card}
              location={location}
              resources={this.props.user.resources}
              style={{
                opacity: this.state.descriptionAnim,
                scale: this.state.descriptionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.3]
                }),
                zIndex: 10
              }}
            />
            : null
        }

        {/* BOOTING SCREEN */}
        {
          card._state &&
          location == "bench" &&
          card._state.turnsTillBoot > 0
            ? <View
                style={{
                  ...globalStyles.absoluteCenter,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                  borderRadius: 6
                }}  
              >
                <Text bold style={{ color: 'white', textAlign: 'center' }}>
                  {card._state.turnsTillBoot} turn till boot...
                </Text>
              </View>
            : null
        }

        {/* CARD IMAGE */}
        <Animated.Image
          resizeMode='cover'
          style={{
            ...styles.cardImage,
            opacity: this.hasEnough ? 1 : 0.6,
            ...(this.props.imageStyle || {}),
            transform: this.imageTransforms,
            borderColor: getRarityColor(card.rarity)
          }}
          source={images.cards[this.props.card.id]}
        />

        {/* STRENGTH DISPLAY */}
        {
          strengthDelta ||
          isAggro && !(card._state && card._state.turnsTillBoot > 0)
          ? <View
              style={{
                position: 'absolute',
                bottom: -3,
                left: 0,
                right: 0,
                alignItems: 'center',
                zIndex: 11
              }}
            >
              <View style={{ ...globalStyles.cobbleBox, position: 'relative' }}>
                <Text bold style={{ fontSize: 10 }}>
                  <Entypo name='controller-volume' size={10} color='white' /> {card.attributes.strength}
                </Text>

                {/* delta bubble */}
                {
                  strengthDelta
                    ? <DeltaBubble delta={strengthDelta} />
                    : null
                }
              </View>
            </View>
          : null
        }
      </Animated.View>
    )
  }
}

export class CardBack extends Component {
  state = {
    fadeinAnim: new Animated.Value(0)
  }
  componentDidMount() {
    Animated.timing(this.state.fadeinAnim, {
      toValue: 1,
      duration: 500
    }).start();
  }
  render() {
    return (
      <Animated.View
        style={{
          ...styles.cardContainer,
          borderWidth: 0,
          opacity: this.state.fadeinAnim,
          scale: this.state.fadeinAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 1]
          }),
          ...(this.props.style || {})
        }}
      >
        <Image
          resizeMode='stretch'
          style={{...styles.cardImage, ...(this.props.imageStyle || {})}}
          source={images.cardCovers[this.props.faction]}
        />
      </Animated.View>
    )
  }
}

export const styles = StyleSheet.create({
  cardContainer: {
    height: 100,
    width: 74,
    position: 'relative',
    shadowRadius: 6,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 6,
    shadowOffset: { x: 0, y: 0 },
  },
  cardImage: {
    height: 100,
    width: 74,
    borderWidth: 4,
    borderColor: 'black',
    borderRadius: 6,
    backgroundColor: '#4F4F4F'
  }
})