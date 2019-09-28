import React, { PureComponent } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Animated,
  PanResponder
} from 'react-native';
import { Text, ArrowButton } from '../custom';
import images from '../../images';
import CardInfo from './CardInfo';
import { hasEnoughResources, getRarityColor } from '../../helpers';
import { Audio } from 'expo-av';
import { Entypo } from '@expo/vector-icons';
import globalStyles from '../../styles';
import DeltaBubble from './DeltaBubble';

export default class Card extends PureComponent {
  _ismounted = false;
  state = {
    panResponder: { panHandlers: {} },

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

  get shouldRespond() {
    const { tutorialPhaseStep, card } = this.props;

    if (!tutorialPhaseStep) {
      return true;
    } else {
      // cases where it should allow in the tutorial
      if (
        ['INTRO_CAST', 'PENDING_CAST'].includes(tutorialPhaseStep) &&
        card.id === "Rapid Bot"
      ) { return true }
      else if (
        ['INTRO_STRENGTH2', 'PENDING_CAST2', 'INTRO_BOOT'].includes(tutorialPhaseStep) &&
        ["Aluminum Bot", "Minion Bot"].includes(card.id)
      ) { return true }
      else if (
        ['INTRO_DISCOVERY', 'PENDING_WINGIT'].includes(tutorialPhaseStep) &&
        card.id === "Controlled Explosion"
      ) { return true }
      else if (['INTRO_DRAG', 'INTRO_REMOVE', 'INTRO_DECK_LIMITS'].includes(tutorialPhaseStep)) { return true }
      else // card not allowed in tutorial
      { return false }
    }
  }

  componentWillMount() {
    this.setPanResponder(this.props.location);
  }
  componentWillReceiveProps(nextProps) {
    this.setPanResponder(nextProps.location);
  }

  setPanResponder(location) {
    const shouldRespond = this.shouldRespond;
    const { tutorialPhaseStep } = this.props;

    let panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {

        // DONT allow focusing on the card
        // IF it should NOT respond, UNLESS tutorialPhaseStep is in 'PENDING'
        if (!shouldRespond && (tutorialPhaseStep && !tutorialPhaseStep.includes('PENDING'))) return;

        this.setState({ focused: true });
        this.state.opacityAnim.setValue(1);

        Animated.spring(this.state.scaleAnim, {
          toValue: 1.3,
          duration: 50,
          // useNativeDriver: true, not supported
        }).start();
        Animated.spring(this.state.descriptionAnim, {
          toValue: 1,
          duration: 50,
          // useNativeDriver: true, not supported
        }).start();

        if (this.props.onPressIn) this.props.onPressIn();
        if (['hand','deck-configuration'].includes(location)) {
          this.props.onPickUp();
        }
      },
      onPanResponderMove: shouldRespond && ['hand', 'deck-configuration'].includes(location)
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
          duration: 50,
          // useNativeDriver: true, not supported
        }).start();
        Animated.spring(this.state.descriptionAnim, {
          toValue: 0,
          duration: 50,
          // useNativeDriver: true, not supported
        }).start();

        if (['hand','deck-configuration'].includes(location)) {
          this.props.onDrop(
            this.isInDropArea,
            location === 'hand' ? this.hasEnough : undefined
          );
          this.isInDropArea = false;
        }

        if (typeof this.props.onPressOut === "function") this.props.onPressOut();

        this.state.pan.setValue({ x: 0, y: 0 });
      }
    });
    this.setState({
      panResponder,
    });
  }

  componentDidMount() {
    this._ismounted = true;

    const { location } = this.props;

    if (!["bench", "hand", "collection", 'deck-configuration'].includes(location)) {
      this.cardDealAudio.loadAsync(
        this.props.isActiveDiscovery
          ? require('../../../assets/audio/ui/discoverycast.mp3')
          : require('../../../assets/audio/ui/carddeal.mp3')
      )
      .then(() => {
        this.cardDealAudio.playAsync();
      });
    }

    if (this.props.fadeInAnim === false) {
      this.state.scaleAnim.setValue(1);
      this.state.opacityAnim.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(this.state.scaleAnim, {
          toValue: 1,
          duration: 500,
          // useNativeDriver: true
        }),
        Animated.timing(this.state.opacityAnim, {
          toValue: 1,
          duration: 500,
          // useNativeDriver: true
        })
      ]).start();
    }

    if (this.props.isActiveDiscovery) {
      // animate the discovery card leaving in 4 seconds
      setTimeout(() => {
        if (!this._ismounted) return;
        Animated.timing(this.state.opacityAnim, {
          toValue: 0,
          duration: 250,
          // useNativeDriver: true
        }).start();
      }, 4250);
    }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.isAggro !== this.props.isAggro && this.props.isAggro) {
      Animated.timing(this.state.aggroAnim, {
        toValue: 1,
        duration: 100,
        // useNativeDriver: true
      }).start(() => {
        if (!this._ismounted) return;

        Animated.timing(this.state.aggroAnim, {
          toValue: 0,
          duration: 100,
          delay: 1200,
          // useNativeDriver: true
        }).start();
      });
    }
    else if (
      prevProps.card.attributes &&
      this.props.card.attributes &&
      prevProps.card.attributes.strength !== this.props.card.attributes.strength
    ) {
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
    if (['hand','deck-configuration'].includes(this.props.location)) {
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

  get tutorialArrow() {
    const { tutorialPhaseStep, card } = this.props;

    if (!tutorialPhaseStep) return null;

    if (tutorialPhaseStep === 'INTRO_CAST' && card.id === "Rapid Bot") {
      return <ArrowButton style={{ position: 'absolute', top: -80, width: 100, zIndex: 100 }} direction='down'/>
    }
    if (tutorialPhaseStep === 'INTRO_DISCOVERY' && card.id === "Controlled Explosion") {
      return <ArrowButton style={{ position: 'absolute', top: -80, width: 100, zIndex: 100 }} direction='down'/>
    }
  }
  render() {
    const { card, location, isAggro, tutorialPhaseStep } = this.props;
    const { aggroAnim, opacityAnim, focused, strengthDelta } = this.state;

    if (!card) return <View />;

    return (
      <Animated.View
        {...this.state.panResponder.panHandlers}
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

        {/* TUTORIAL ARROW */}
        {this.tutorialArrow}

        {/* BOOTING SCREEN */}
        {
          (location == "bench" || location == "bench-opponent") &&
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

export class CardBack extends PureComponent {
  state = {
    fadeinAnim: new Animated.Value(0)
  }
  componentDidMount() {
    Animated.timing(this.state.fadeinAnim, {
      toValue: 1,
      duration: 500,
      delay: 500,
      // useNativeDriver: true, not supported
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

export class CardPack extends PureComponent {
  state = {
    pan: new Animated.ValueXY(),
    scaleAnim: new Animated.Value(1),
  }

  panResponder = { panHandlers: {} }
  componentWillMount() {
    if (!this.props.dropArea) return;

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        Animated.spring(this.state.scaleAnim, {
          toValue: 1.3,
          duration: 50,
          // useNativeDriver: true, not supported
        }).start();

        this.props.onPickUp();
      },
      onPanResponderMove: Animated.event([
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
        }),
      onPanResponderRelease: () => {
        Animated.spring(this.state.scaleAnim, {
          toValue: 1,
          duration: 50,
          // useNativeDriver: true, not supported
        }).start();

        this.props.onDrop(this.isInDropArea);
        this.isInDropArea = false;

        this.state.pan.setValue({ x: 0, y: 0 });
      }
    });
  }
  render() {
    return (
      <Animated.View
        {...this.panResponder.panHandlers}
        style={{
          ...styles.cardContainer,
          position: 'relative',
          overflow: 'visible',
          ...this.props.containerStyle,
          transform: [
            { scale: this.state.scaleAnim },
            ...this.state.pan.getTranslateTransform()
          ],
        }}
      >
        {
          [3, 2, 1, 0].map((i, l) =>
            <View
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'visible',
                zIndex: i
              }}
            >
              <CardBack
                style={{
                  transform: [{ rotateZ: `${(l - i) * 4}deg` }],
                  ...this.props.style
                }}
                imageStyle={{
                  ...this.props.imageStyle
                }}
                faction={this.props.faction}
              />
            </View>
          )
        }
      </Animated.View>
    )
  }
}
export const styles = StyleSheet.create({
  cardContainer: {
    height: 100,
    width: 80,
    position: 'relative',
    shadowRadius: 6,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 6,
    shadowOffset: { x: 0, y: 0 },
    overflow: 'visible'
  },
  cardImage: {
    height: 100,
    width: 80,
    borderWidth: 4,
    borderColor: 'black',
    borderRadius: 6,
    backgroundColor: '#4F4F4F'
  }
})