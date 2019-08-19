import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Animated
} from 'react-native';
import globalStyles from '../../styles';
import { ScrollView, TouchableWithoutFeedback, TouchableOpacity } from 'react-native-gesture-handler';
import { Button, Text } from '../custom';
import { CardBack, CardPack } from '../Duel/Card';
import { capitalize } from '../../helpers';
import { Audio } from 'expo-av';
import socket from '../../socket';
import { LinearGradient } from 'expo-linear-gradient';

export default class Shop extends Component {
  _mounted = false;
  state = {
    selectedDeckName: null,
    offers: null,
    selectedOffer: null
  }
  componentDidMount() {
    this._mounted = true;

    this.getOffers();
    socket.on('connect', () => {
      if (this._mounted) this.getOffers();
    });
  }
  componentWillUnmount() {
    this._mounted = false;
  }
  getOffers() {
    socket.emit('shop.getOffers', (err, offers) => {
      const selectedOffer = Object.values(offers)[0];
      this.setState({ offers, selectedOffer });
    });
  }
  normalizePrize(cents) {
    const dollars = Math.floor(cents / 100);
    const remainderCents = cents % 100;

    return `$${dollars}.${remainderCents}`
  }
  render() {
    const { selectedDeckName, selectedOffer } = this.state;

    return (
      <View style={styles.mainContainer}>
        {/* sidebar */}
        <View style={styles.sideBar}>
          <ScrollView
            style={{
              ...globalStyles.cobbleBox,
              flex: 1,
              marginBottom: 8,
              borderColor: '#4F4F4F',
              backgroundColor: '#333',
              padding: 8
            }}
          >
            {
              ['classic'].map((deckName) =>
                <TouchableWithoutFeedback
                  key={deckName}
                  onPress={() => {
                    new Audio.Sound().loadAsync(require('../../../assets/audio/ui/buttonpress.mp3'), { shouldPlay: true });
                    this.setState({ selectedDeckName: deckName, selectedOffer: null });
                  }}
                >
                  <View style={styles.deckContainer}>
                    <CardBack
                      faction={deckName}
                      imageStyle={{
                        width: 107,
                        height: 156
                      }}
                      style={{
                        width: 107,
                        height: 156,
                        ...(this.state.selectedDeckName === deckName ? {
                          shadowColor: '#33E1FF',
                          shadowRadius: 14,
                          shadowOpacity: 0.9
                        } : {})
                      }}
                    />
                    <View style={styles.deckLabel}>
                      <Text bold style={{ textAlign: 'center', color: '#333' }}>{capitalize(deckName)} Deck</Text>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              )
            }
          </ScrollView>
          <Button onPress={this.props.onClose} title="Exit" />
        </View>

        {/* main view */}
        <View style={styles.mainContent}>
          <ImageBackground
            source={require('../../../assets/img/ui/backgrounds/shop-board.png')}
            resizeMode='stretch'
            style={styles.boardContainer}
          >
            {
              selectedDeckName
              ? (
                <View style={styles.board}>
                  <View style={{ alignItems: 'center', marginVertical: 18 }}>
                    <View
                      style={{
                        position: 'relative',
                        width: 80,
                        height: 108,
                      }}
                    >
                      {
                        [
                          ...(
                            selectedOffer
                              ? Array.apply(null, { length: selectedOffer.packs }).map(Number.call, Number)
                              : [0]
                          )
                        ].map(i =>
                          <AnimatedPack selectedDeckName={selectedDeckName} i={i} />
                        )
                      }
                    </View>
                  </View>
                  <View style={styles.pricesContainer}>
                    {
                      Object.values(this.state.offers).map(offer =>
                        <View style={{ flex: 1, overflow: 'visible' }}>
                          <TouchableOpacity
                            onPress={() => {
                              new Audio.Sound().loadAsync(require('../../../assets/audio/ui/carddeal.mp3'), { shouldPlay: true });
                              this.setState({ selectedOffer: offer })
                            }}
                            key={offer.id}
                            style={{ alignSelf: 'stretch', overflow: 'visible' }}
                          >
                            <View
                              style={{
                                ...styles.offerTag,
                                ...(selectedOffer && selectedOffer.id === offer.id ? {
                                  borderColor: '#33E1FF',
                                  shadowColor: '#33E1FF',
                                  shadowRadius: 4,
                                  shadowOpacity: 0.8
                                } : {})
                              }}
                            >
                              <Text bold style={{ fontSize: 12, color: 'white', textAlign: 'center' }}>
                                {offer.packs} Pack{offer.packs > 1 ? 's' : ''}
                              </Text>
                              <Text bold style={{ color: '#BDBDBD', fontSize: 8 }}>
                                {this.normalizePrize(offer.priceInCents)}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      )
                    }
                  </View>
                  <View style={styles.descriptionBox}>
                    <View style={{ flex: 2 }}>
                      <Text bold style={{ color: '#333', fontSize: 18 }}>
                        Contents:
                      </Text>
                      <Text bold style={{ color: '#4F4F4F' }}>
                        { 5 * (selectedOffer ? selectedOffer.packs : 1) } { selectedDeckName } cards.
                        At least {(selectedOffer ? selectedOffer.packs : 1)} will be rare or better.
                      </Text>
                    </View>
                    <LinearGradient
                      colors={['#DBC25E', '#A89548']}
                      style={{
                        borderWidth: 1,
                        borderColor: '#BDA753',
                        padding: 6,
                        alignItems: 'stretch',
                        borderRadius: 6,
                        flex: 1,
                        marginLeft: 6
                      }}
                    >
                      <View style={globalStyles.cobbleBox}>
                        <Text bold>
                          {
                            selectedOffer
                              ? this.normalizePrize(selectedOffer.priceInCents)
                              : '$-.--'
                          }
                        </Text>
                      </View>
                      <Button
                        title="Buy"
                        charged
                        disabled={!selectedOffer}
                        style={{ marginTop: 4 }}
                      />
                    </LinearGradient>
                  </View>
                </View>
              )
              : <Text bold style={{ fontSize: 18 }}>Select a deck</Text>
            }
          </ImageBackground>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#351818',
    borderWidth: 5,
    borderColor: '#4F4F4F',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    maxWidth: 710
  },
  sideBar: {
    marginRight: 8
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#BDBDBD',
    padding: 10,
    borderRadius: 8,
  },
  boardContainer: {
    alignSelf: 'stretch',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    padding: 18,
    alignSelf: 'stretch',
    alignItems: 'stretch'
  },
  deckContainer: {
    ...globalStyles.cobbleBox,
    backgroundColor: '#4F4F4F',
    borderColor: '#BDBDBD',
    padding: 8,
    margin: 6
  },
  pricesContainer: {
    backgroundColor: '#000',
    borderColor: '#808080',
    borderWidth: 2, 
    borderRadius: 8,
    paddingHorizontal: 3,
    flexDirection: 'row',
    overflow: 'visible',
  },
  deckLabel: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    alignItems: 'center',
    padding: 6,
    marginTop: 8,
    alignSelf: 'stretch'
  },
  descriptionBox: {
    backgroundColor: '#C8C8C8',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginTop: 4
  },
  offerTag: {
    ...globalStyles.cobbleBox,
    marginHorizontal: 3,
    marginVertical: 6,
    borderColor: '#DBC25E',
    alignItems: 'center',
    padding: 0,
    paddingVertical: 4,
    borderWidth: 2,
    borderRadius: 4,
    alignSelf: 'stretch'
  }
});

class AnimatedPack extends Component {
  animation = new Animated.Value(0);

  componentDidMount() {
    const { i } = this.props;
    Animated.timing(this.animation, {
      toValue: 1,
      fromValue: 0,
      duration: 1000
    }).start();
  }
  render() {
    const { selectedDeckName, i } = this.props;
    return (
      <Animated.View style={{ transform: [ { scale: this.animation.interpolate({ inputRange: [0, 1], outputRange: [5, 1 + (i * 0.01)] }) } ] }}>
        <CardPack
          faction={selectedDeckName}
          containerStyle={{
            width: 80,
            height: 108,
            position: 'absolute',
            padding: 0,
            top: 0,
            left: 0
          }}
          imageStyle={{
            width: 80,
            height: 108,
            transform: [
              { rotateZ: (`${i * 2}deg`)}
            ],
          }}
          style={{
            shadowColor: 'gold',
            shadowRadius: 5,
            shadowOpacity: 0.4
          }}
        />
      </Animated.View>
    )
  }
}