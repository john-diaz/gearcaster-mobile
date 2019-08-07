import React, { Component } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ImageBackground,
  Image,
  Alert
} from 'react-native';
import { ScrollView, TouchableHighlight } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import { Button, ArrowButton, Text } from '../components/custom';
import socket from '../socket';
import Card, { CardBack, styles as cardStyles } from '../components/Duel/Card';
import globalStyles from '../styles';
import { capitalize } from '../helpers';
import { Audio } from 'expo-av';
import images from '../images';
import { LinearGradient } from 'expo-linear-gradient';

let rolloverAudio = new Audio.Sound();
rolloverAudio.loadAsync(require('../../assets/audio/ui/rollover.mp3'));

class DeckConfiguration extends Component {
  state = {
    selectedDeck: null,
    collection: {
      spareCards: [],
      configuredDecks: {
        // valid: Boolean,
        // cards: AnyCard[]
      }
    },
    // layout stuff
    dropLayout: { pageX: undefined, pageY: undefined, width: undefined, height: undefined },
    offsetIndex: 0,
    hoveringCard: null,
    glowDropArea: new Animated.Value(0)
  }
  componentDidMount() {
    socket.on('connect', () => this.loadCollection);
    this.loadCollection();
  }
  componentDidUpdate(prevProps) {
    if (!prevProps.user && !!this.props.user) {
      this.loadCollection();
    }
  }
  loadCollection() {
    const { user } = this.props;

    if (!user) return console.log('failed to load collection, unauthenticated');

    socket.emit('user.collection', user.username, (err, collection) => {
      if (!err && collection) {
        this.setState({ collection });
      } else {
        console.warn(err);
      }
    });
  }

  /**
   * return spare cards and all cards in all configuredDecks
   */
  get allCards() {
    const { collection } = this.state;

    // reduce the cards in each deck into a single array of cards
    const deckCards = Object.values(collection.configuredDecks).reduce((memo, deck) => ([
      ...memo,
      ...deck.cards
    ]), []);

    // combines the quantities of cards in both deckCards and spareCards
    // example:
    // There are 2 "Minion Bot"s in deckCards and 3 "Minion Bot"s in spareCards
    // cardQuantityKeys["Minion Bot"] = {...card, quantity: 5 }
    const cardQuantityKeys = ([...collection.spareCards, ...deckCards]).reduce((memo, card) => {
      if (!memo[card.id]) {
        memo[card.id] = {
          ...card,
          quantity: 0
        }
      }

      memo[card.id].quantity += card.quantity;
      return memo;
    }, {});

    return Object.values(cardQuantityKeys);
  }
  /**
   * Cards in the selected deck
   */
  get cardsInDeck() {
    const { selectedDeck, collection } = this.state;
    return collection.configuredDecks[selectedDeck].cards;
  }

  /**
   * either shows all cards or selectedDeck.cards
   * shows one slice at a time (8 cards) based on offsetIndex.
   * Also filters amount of cards in deck when there is a deck
   * Example: There are 4 "Minion Bot"s in allCards and 2 in selectedDeck. Return 2 "Minion Bot"
   */
  sampleCards(offsetIndex) {
    const { collection, selectedDeck } = this.state;
    const offsetLength = 8;
    const allCards = this.allCards;
    let array = [...allCards];

    if (selectedDeck) {// show amount left after filtering deck cards

      // object of card.id's (key) with their quantities (value)
      let quantityKeys = allCards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});

      const deck = collection.configuredDecks[selectedDeck];
      deck.cards.forEach(card => {
        quantityKeys[card.id].quantity -= card.quantity;
      });
      array = Object.values(quantityKeys);
    }

    return array
            .slice(offsetIndex * offsetLength, offsetIndex * offsetLength + offsetLength)
            .sort((a, b) => {
              if(a.id < b.id) return -1;
              if(a.id > b.id) return 1;
              return 0;
            });
  }

  totalDeckSize(selectedDeck) {
    let size = 0;

    const deck = this.state.collection.configuredDecks[selectedDeck];

    if (!deck) return undefined;

    deck.cards.forEach((c) => {
      size += c.quantity;
    });

    return size;
  }
  /**
   * Called by the side bar when the user selects a deck
   */
  setDeck = (selectedDeck) => {
    rolloverAudio.playFromPositionAsync(0);
    this.setState({ selectedDeck });
  }

  /**
   * request to add a card to the selected deck
   * */
  addToDeck(cardID) {
    if (!this.state.selectedDeck) return;
    const deckName = this.state.selectedDeck;

    socket.emit('deck.addCard', { deckName, cardID }, (err, isValid) => {
      if (err) return Alert.alert(err);

      rolloverAudio.playFromPositionAsync(0);
      /* REMOVE FROM SPARE CARDS */
      let spareCardsObj = this.state.collection.spareCards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});
      spareCardsObj[cardID].quantity = Math.max(0, spareCardsObj[cardID].quantity - 1);

      /* ADD TO DECK */
      let deck = this.state.collection.configuredDecks[deckName];

      let deckCardsObj = deck.cards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});

      if (!deckCardsObj[cardID]) {
        deckCardsObj[cardID] = {
          ...spareCardsObj[cardID],
          quantity: 0
        }
      }
      deckCardsObj[cardID].quantity += 1;

      /* SAVE EVERYTHING IN STATE */
      deck.cards = Object.values(deckCardsObj);
      deck.isValid = isValid;

      this.state.collection.spareCards = Object.values(spareCardsObj);

      this.setState(this.state);
    })
  }

  /**
   * request to remove a card from the currently selected deck
   */
  removeFromDeck(cardID) {
    const deckName = this.state.selectedDeck;
    if (!deckName) return;

    socket.emit('deck.removeCard', { deckName, cardID }, (err, isValid) => {
      if (err) return Alert.alert(err);

      rolloverAudio.playFromPositionAsync(0);

      /* REMOVE FROM DECK */
      let deck = this.state.collection.configuredDecks[deckName];

      let deckCardsObj = deck.cards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});

      deckCardsObj[cardID].quantity -= 1;

      /* ADD TO SPARE CARDS */
      let spareCardsObj = this.state.collection.spareCards.reduce((memo, card) => ({
        ...memo,
        [card.id]: card
      }), {});

      if (!spareCardsObj[cardID]) {
        spareCardsObj[cardID] = {
          ...deckCardsObj[cardID],
          quantity: 0
        }
      }
      spareCardsObj[cardID].quantity += 1;

      if (!deckCardsObj[cardID].quantity) {
        delete deckCardsObj[cardID]
      }

      /* SAVE EVERYTHING IN STATE */
      deck.cards = Object.values(deckCardsObj);
      deck.isValid = isValid;

      this.state.collection.spareCards = Object.values(spareCardsObj);

      this.setState(this.state);
    });
  }
  
  render() {
    const { offsetIndex, selectedDeck, collection } = this.state;
    const sampleCards = this.sampleCards(offsetIndex);

    const { user } = this.props;

    if (!user) return <View/>;

    return (
      <View style={{ flex: 1, backgroundColor: '#776969' }}>
        <View style={styles.deckConfigurationView}>
          {/* HEADER */}
          <View style={styles.headerContainer}>
            <ImageBackground
              source={require('../../assets/img/ui/backgrounds/tatami-header.png')}
              style={{
                width: '100%',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'stretch',
                paddingBottom: 8
              }}
              resizeMode="cover"
            >
              <View
                style={{
                  flexDirection: 'row',
                  maxWidth: 710,
                  marginHorizontal: 6,
                  alignItems: 'flex-start',
                  justifyContent: 'space-between'
                }}
              >
                <Button
                  title="Back"
                  stoneContainer
                  urgent
                  containerStyle={{
                    flex: 1
                  }}
                  onPress={() => this.props.navigation.navigate('Landing')}
                />
                <Button
                  title="Shop"
                  stoneContainer
                  containerStyle={{
                    flex: 2,
                    marginHorizontal: 15
                  }}
                />
                <Button
                  title="Open Packs"
                  stoneContainer
                  containerStyle={{
                    flex: 2,
                    marginHorizontal: 15
                  }}
                />
                <Button
                  title="Play"
                  stoneContainer
                  containerStyle={{
                    flex: 2
                  }}
                />
              </View>
            </ImageBackground>
          </View>

          {/* BOARD CONTAINER */}
          <View style={styles.boardContainer}>
            {/* MAIN CONTAINER BOARD */}
            <View style={styles.mainBoardContainer}>
              {/* LEFT PAGE BUTTON */}
              {this.state.offsetIndex > 0
                ? <View style={{...styles.nextPageButtonContainer, left: -22}}>
                    <ArrowButton
                      direction='left'
                      style={{
                        height: 54,
                        width: 108,
                      }}
                      onPress={() => {
                        this.setState({ offsetIndex: this.state.offsetIndex - 1 });
                      }}
                    />
                  </View>
                : null
              }

              {/* MAIN BOARD */}
              <ImageBackground
                style={styles.mainBoard}
                source={require('../../assets/img/ui/backgrounds/deckconfig-bg.png')}
                resizeMode="stretch"
              >
                <View style={styles.boardList}>
                  {
                    sampleCards.map((c) => {
                      return (
                        <View
                          style={{
                            marginHorizontal: 5,
                            zIndex: this.state.hoveringCard === c.instanceID ? 1000 : null
                          }}
                          key={c.instanceID}
                        >
                          <Card
                            card={c}
                            location={selectedDeck ? 'deck-configuration' : 'collection'}
                            fadeInAnim={false}
                            user={{
                              resources: {
                                health: 10000,
                                gears: 10000
                              }
                            }}
                            imageStyle={{
                              opacity: c.quantity === 0 ? 0.6 : 1
                            }}
                            onPressIn={() => this.setState({ hoveringCard: c.instanceID })}
                            onPressOut={() => this.setState({ hoveringCard: null })}

                            // drop are stuff
                            dropArea={this.state.dropLayout}
                            onPickUp={() => {
                              Animated.timing(this.state.glowDropArea, {
                                toValue: 1,
                                duration: 700
                              }).start();
                            }}
                            onDrop={(inArea) => {
                              Animated.timing(this.state.glowDropArea, {
                                toValue: 0,
                                duration: 700
                              }).start();
                              if (inArea && selectedDeck && c.quantity > 0) {
                                this.addToDeck(c.id);
                              }
                            }}
                          />
                          <View style={styles.quantityLabel}>
                            <Text bold style={{ fontSize: 12 }}>x{c.quantity}</Text>
                          </View>
                        </View>
                      )
                    }
                    )
                  }
                </View>
              </ImageBackground>

              {/* RIGHT PAGE BUTTON */}
              {this.sampleCards(this.state.offsetIndex + 1).length > 0
                ? <View style={{...styles.nextPageButtonContainer, right: -22}}>
                    <ArrowButton
                      direction='right'
                      style={{
                        height: 54,
                        width: 108,
                      }}
                      onPress={() => {
                        this.setState({ offsetIndex: this.state.offsetIndex + 1 });
                      }}
                    />
                  </View>
                : null
              }
            </View>

            {/* BOARD SIDEBAR */}
            {!selectedDeck ? ( /* SHOW LIST OF DECKS */
              <View style={styles.sidebarContainer}>
                {/* HEADER */}
                <View style={styles.collectionHeader}>
                  <Text bold style={{ fontSize: 16, textAlign: 'center' }}>Choose a Deck</Text>
                </View>
                {/* LIST */}
                <ScrollView style={{ flex: 1 }}>
                  {
                    ["classic", "steampunk"].map((deckName, i) => {
                      const deck = this.props.user.configuredDecks[deckName];

                      return (
                        <TouchableHighlight
                          onPress={() => { if (deck) this.setDeck(deckName) }}
                          activeOpacity={deck ? 1 : 0.85}
                          key={deckName}
                        >
                          <ImageBackground
                            key={deckName}
                            style={{
                              ...styles.deckContainer,
                              opacity: deck ? 1 : 0.8,
                              backgroundColor: deck ? '#BDBDBD' : '#4F4F4F'
                            }}
                            source={require('../../assets/img/ui/backgrounds/bg.png')}
                            resizeMode='repeat'
                          >
                            <CardBack
                              faction={deckName}
                              style={{
                                height: 52,
                                width: 38
                              }}
                              imageStyle={{
                                height: 52,
                                width: 38,
                                borderWidth: 1,
                                borderRadius: 3
                              }}
                            />
                            <View style={styles.deckContent}>
                              <Text bold style={{ fontSize: 16 }}>{capitalize(deckName)} deck</Text>
                              {
                                deck
                                  ? <Text style={{ fontSize: 14 }}>{this.totalDeckSize(deckName)}/30</Text>
                                  : <Text bold style={{ fontSize: 12 }}>reach phase {i} in Adventure Mode to unlock</Text>
                              }
                            </View>
                          </ImageBackground>
                        </TouchableHighlight>
                      )
                    })
                  }
                </ScrollView>
              </View>
            )
            : ( /* SHOW CARDS IN DECK */
              <View style={{ width: styles.sidebarContainer.width }}>
                {/* HEADER */}
                <ImageBackground
                  style={styles.deckHeader}
                  source={images.cardCovers[selectedDeck]}
                  resizeMode='cover'
                >
                  <Text bold style={{ fontSize: 18, textAlign: 'right' }}>{capitalize(selectedDeck)} Deck</Text>
                  <Text style={{ fontSize: 16, textAlign: 'right' }}>{this.totalDeckSize(selectedDeck)}/30</Text>
                </ImageBackground>
                <Animated.View
                  style={{
                    ...styles.sidebarContainer,
                    flex: 1,
                    padding: 3,
                    borderColor: this.state.glowDropArea.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#4F4F4F', 'gold']
                    }),
                    scale: this.state.glowDropArea.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1]
                    }),
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                    }}
                    ref="dropAreaRef"
                    onLayout={(e) => {
                      this.refs.dropAreaRef.measure((x, y, width, height, pageX, pageY) => {
                        this.setState({
                          dropLayout: { pageX, height, width, pageY }
                        });
                      });
                    }}
                  >
                    <ScrollView
                      style={{ flex: 1 }}
                    >
                      {
                        this.cardsInDeck.map((card, i) =>
                          <TouchableHighlight
                            onPress={() => this.removeFromDeck(card.id)}
                            key={card.instanceID}
                          >
                            <View style={styles.deckCardContainer}>
                              <Image
                                source={images.cards[card.id]}
                                style={{
                                  width: 60,
                                  height: 60,
                                  position: 'absolute',
                                  right: 0
                                }}
                                resizeMode='cover'
                              />
                              <LinearGradient
                                colors={['#333','#4F4F4F', 'transparent']}
                                locations={[0, 0.75, 1]}
                                start={[0, 0.5]}
                                end={[1, 0.5]}
                                style={{
                                  flex: 1,
                                  padding: 8,
                                  marginRight: 18,
                                  justifyContent: 'center'
                                }}
                              >
                                <Text bold style={{ fontSize: 14 }}>
                                  {card.name} {card.quantity > 1 ? `(${card.quantity})` : null}
                                </Text>
                              </LinearGradient>
                            </View>
                          </TouchableHighlight>
                        )
                      }
                    </ScrollView>
                    <Button
                      title='Back'
                      onPress={() => this.setDeck(null)}
                    />
                  </View>
                </Animated.View>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  deckConfigurationView: {
    overflow: 'visible',
    flex: 1,
    backgroundColor: '#351818',
    marginLeft: 6,
    marginRight: 6,
    paddingTop: 58,
  },
  headerContainer: {
    position: 'absolute',
    alignItems: 'stretch',
    top: 0,
    left: -6,
    right: -6,
    backgroundColor: 'rgba(79,79,79,0.75)',
    paddingBottom: 6,
    zIndex: 10
  },
  boardContainer: {
    maxWidth: 710,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    margin: 12,
    zIndex: 15
  },
  mainBoardContainer: {
    backgroundColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'stretch',
    borderRadius: 12,
    padding: 13,
    flex: 1,
    marginRight: 8,
    position: 'relative',
    zIndex: 10 // over the sidebar
  },
  mainBoard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    zIndex: 11, // hover over the page arrows
  },
  boardList: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: (4 * (cardStyles.cardContainer.width + 11)),
  },
  nextPageButtonContainer: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // hover over mainBoardContainer
  },
  quantityLabel: {
    ...globalStyles.cobbleBox,
    marginVertical: 3,
    borderWidth: 2,
    padding: 2,
    borderRadius: 3
  },

  // sidebar styles
  sidebarContainer: {
    width: 198,
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 6,
    borderColor: '#4F4F4F',
    alignItems: 'stretch',
    alignSelf: 'stretch'
  },
  collectionHeader: {
    backgroundColor: '#735720',
    borderBottomWidth: 6,
    borderColor: '#4F4F4F',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    padding: 4
  },
  deckContainer: {
    position: 'relative',
    backgroundColor: '#BDBDBD',
    borderWidth: 5,
    borderColor: '#828282',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 3,
    margin: 4,
    marginBottom: 0
  },
  deckContent: {
    flex: 1,
    alignSelf: 'stretch',
    marginLeft: 5,
    paddingTop: 4
  },
  deckHeader: {
    position: 'relative',
    borderWidth: 6,
    borderRadius: 8,
    borderColor: '#BDBDBD',
    marginBottom: 3,
    paddingVertical: 4,
    alignItems: 'flex-end',
    textAlign: 'right',
    backgroundColor: 'rgba(0,0,0,0.27)'
  },
  deckCardContainer: {
    position: 'relative',
    alignSelf: 'stretch',
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 4,
    backgroundColor: 'white',
    borderRadius: 3,
    alignItems: 'stretch',
    justifyContent: 'center',
    minHeight: 35,
    overflow: 'hidden'
  }
});

const mapStateToProps = state => ({
  user: state.user
});

export default connect(mapStateToProps, null)(DeckConfiguration);
