import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image
} from 'react-native';
import globalStyles from '../../styles';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Text } from '../custom';
import { CardBack, CardPack } from './Card';
import navigationService from '../../navigationService';

export default class PostDuel extends Component {
  animation = new Animated.Value(0);
  transitionAnim = new Animated.Value(0);

  componentDidMount() {
    Animated.timing(this.animation, {
      toValue: 1,
      duration: 800
    }).start();
  }

  get rewardPack() {
    const { selfUser, rewardPacks} = this.props;
    return rewardPacks[selfUser.id];
  }
  render() {
    const { selfWon, selfUser } = this.props;
    const { rewardPack } = this;

    return (
      <Animated.View
        style={{
          ...styles.postDuelContainer,
          opacity: this.animation
        }}
      >
        {/* VICTORY/DEFEAT VIEW */}
        <Animated.View
          style={{
            ...globalStyles.absoluteCenter,
            justifyContent: 'center',
            alignItems: 'center',
            left: this.transitionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -1000]
            })
          }}
        >
          <Animated.View style={{ position: 'relative' }} >
            {/* TEXT BOX */}
            <View style={styles.headerContainer} >
              <View style={styles.header} >
                <Text style={{ fontSize: 22 }} bold>
                  { selfWon ? 'Victory' : 'Defeat' }
                </Text>
              </View>
            </View>
            {/* AVATAR */}
            <TouchableWithoutFeedback
              onPress={() => {
                Animated.timing(this.transitionAnim, {
                  toValue: 1,
                  duration: 800
                }).start();
              }}
            >
              <Image
                source={require('../../../assets/img/ui/card-covers/classic.png')}
                resizeMode='cover'
                style={styles.avatar}
              />
            </TouchableWithoutFeedback>
          </Animated.View>
        </Animated.View>

        {/* REWARD VIEW */}
        <Animated.View
          style={{
            ...globalStyles.absoluteCenter,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'blue',
            left: this.transitionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1000, 0]
            })
          }}
        >
          {/* REWARD PACK */}
          <Animated.View style={{ position: 'relative' }} >
            {/* TEXT BOX */}
            <View style={styles.headerContainer} >
              <View style={styles.header} >
                <Text style={{ fontSize: 22 }} bold>Reward Pack</Text>
              </View>
            </View>

            {/* CARD PACK */}
            <TouchableWithoutFeedback
              style={{
                overflow: 'visible',
                padding: 15
              }}
              onPress={() => {
                if (selfUser.needsToLearn.includes("intro-duel")) {
                  navigationService.navigate('Landing');
                } else {
                  navigationService.navigate('DeckConfiguration');
                }
              }}
            >
              <CardPack
                faction={rewardPack.faction}
                containerStyle={{
                  height: 150,
                  width: 110
                }}
                style={{
                  height: 150,
                  width: 110
                }}
                imageStyle={{
                  height: 150,
                  width: 110
                }}
              />
            </TouchableWithoutFeedback>

            {/* PACK TITLE */}
            <View style={styles.subHeaderContainer}>
              <View style={styles.subHeader}>
                <Text style={{ fontSize: 12 }} bold>{rewardPack.prefix} Pack</Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  postDuelContainer: {
    ...globalStyles.absoluteCenter,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000
  },
  avatar: {
    height: 130,
    width: 130,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 5,
    borderWidth: 5,
    borderColor: '#B4A68B',
    borderRadius: 8,
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    shadowRadius: 10
  },
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -65,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    ...globalStyles.cobbleBox,
    shadowColor: '#7957D5',
    shadowRadius: 64,
    width: 180
  },
  subHeaderContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -55,
    justifyContent: 'center',
    alignItems: 'center'
  },
  subHeader: {
    ...globalStyles.fadedCobblebox,
    shadowColor: '#7957D5',
    shadowRadius: 64,
    width: 140
  }
});
