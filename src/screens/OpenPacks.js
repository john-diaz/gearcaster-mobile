import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ImageBackground,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import { connect } from 'react-redux';
import Card, { CardPack, styles as cardStyles, CardBack } from '../components/Duel/Card';
import globalStyles from '../styles';
import { Text, Button } from '../components/custom';
import socket from '../socket';
import { uuidv4 } from '../helpers';
import { Audio } from 'expo-av';

class OpenPacks extends Component {
  state = {
    dropLayout: { pageX: undefined, height: undefined, width: undefined, pageY: undefined },
    hoveringPack: null,
    fadeAnim: new Animated.Value(0.5),
    openPack: null
  }
  openPackRequest(packID) {
    socket.emit('user.openPack', packID, (error, cards) => {
      if (error) Alert.alert(error);
      else {
        const revealSound = new Audio.Sound();
        revealSound.loadAsync(require('../../assets/audio/ui/revealDeck.mp3'), {
          shouldPlay: true,
          volume: 0.75
        });
        this.setState({
          openPack: cards.reduce((memo, card) => ({
            ...memo,
            [uuidv4()] : {
              ...card,
              revealed: false
            }
          }), {}),
        });
      }
    });
  }
  revealCard(instanceID) {
    const card = this.state.openPack[instanceID];
    if (!card) return console.warn('Card not found to reveal.', instanceID);

    const revealSound = new Audio.Sound();
    revealSound.loadAsync(require('../../assets/audio/ui/revealCard.mp3'), {
      shouldPlay: true,
      volume: 0.75
    });

    this.state.openPack[instanceID].revealed = true;

    this.setState(this.state);
  }
  render() {
    return (
      <ImageBackground
        source={require('../../assets/img/backgrounds/clouds.png')}
        style={styles.backgroundImage}
      >
        <ImageBackground
          source={require('../../assets/img/ui/backgrounds/tatami.png')}
          style={styles.boardContainer}
          resizeMode='stretch'
        >
          {/* sidebar */}
          <ImageBackground
            source={require('../../assets/img/ui/backgrounds/packs-sidebar.png')}
            style={styles.sidebar}
            resizeMode='stretch'
          >
            {/* overlay the sidebar when opening a pack */}
            {
              this.state.openPack ? (
                <View style={{...globalStyles.absoluteCenter, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 20}}/>
              )
              : null
            }

            {/* scroll list */}
            <ScrollView
              style={{ flex: 1, alignItems: 'center', overflow: 'visible' }}
            >
              {
                Object.values(this.props.user.unopenedPacks).map(pack =>
                  <View style={styles.unopenedPackContainer} key={pack.id}>
                    {
                      this.state.hoveringPack !== pack.id
                      ? (
                        <View
                          style={{
                            ...globalStyles.fadedCobblebox,
                            borderRadius: 2,
                            borderWidth: 2,
                            zIndex: 10,
                            marginLeft: -20,
                            marginRight: -20
                          }}
                        >
                          <Text bold style={{ textAlign: 'center' }}>{pack.prefix} deck</Text>
                        </View>
                      )
                      : null
                    }
                    <CardPack
                      faction={pack.faction}
                      dropArea={this.state.dropLayout}
                      onPickUp={() => {
                        this.refs.dropAreaRef.measure((x, y, width, height, pageX, pageY) => {
                          this.setState({
                            dropLayout: { pageX, height, width, pageY }
                          });
                        });
                        this.setState({
                          hoveringPack: pack.id,
                        });
                        Animated.timing(this.state.fadeAnim, {
                          toValue: 0.4,
                          duration: 100,
                          useNativeDriver: true
                        }).start();
                      }}
                      onDrop={inArea => {
                        this.setState({
                          hoveringPack: null,
                        });
                        Animated.timing(this.state.fadeAnim, {
                          toValue: 0.5,
                          duration: 100,
                          useNativeDriver: true
                        }).start();

                        if (inArea) {
                          this.openPackRequest(pack.id);
                        }
                      }}
                      containerStyle={{
                        ...globalStyles.absoluteCenter,
                        zIndex: 5
                      }}
                      imageStyle={{
                        shadowColor: '#DBC25E'
                      }}
                    />
                  </View>
                )
              }
            </ScrollView>
            <Button
              title='Back'
              onPress={() => this.props.navigation.navigate('DeckConfiguration')}
            />
          </ImageBackground>

          {/* board */}
          <View
            style={{
              ...globalStyles.absoluteCenter,
              left: styles.sidebar.width,
              justifyContent: 'center',
              alignItems: 'center',
              ...(this.state.openPack ? {
                zIndex: 15, // hover over the sidebar
              } : {})
            }}
            ref="dropAreaRef"
            onLayout={(e) => {
              this.refs.dropAreaRef.measure((x, y, width, height, pageX, pageY ) => {
                this.setState({
                  dropLayout: { pageX, height, width, pageY }
                });
              });
            }}
          >
            {/* dark overlay on the board */}
            {
              !this.state.openPack
              ? <Animated.View
                  style={{
                    ...globalStyles.absoluteCenter,
                    backgroundColor: 'black',
                    opacity: this.state.fadeAnim
                  }}
                >
                
                </Animated.View>
              : (
                // SHOW OPEN PACK CARDS
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.packCards}>
                    {
                      Object.entries(this.state.openPack).map(([ instanceID, card ]) =>
                        card.revealed
                        ? (
                          <Card
                            card={card}
                            key={instanceID}
                            location='open-pack'
                            user={{
                              resources: { gears: 1000, health: 1000 }
                            }}
                            style={{
                              margin: 10
                            }}
                          />
                        )
                        : (
                          <TouchableOpacity
                            onPress={() => this.revealCard(instanceID)}
                          >
                            <CardBack
                              faction={card.faction}
                              style={{
                                margin: 10,
                                shadowColor: 'gold',
                                shadowOpacity: 0.8,
                                shadowRadius: 8
                              }}
                            />
                          </TouchableOpacity>
                        )
                      )
                    }
                  </View>
                  {/* BACK BUTTON */}
                  {
                    !Object.values(this.state.openPack).find(c => !c.revealed)
                    ? (
                      <Button
                        title='OK'
                        containerStyle={{
                          minWidth: 150
                        }}
                        onPress={() => {
                          this.setState({ openPack: null });
                        }}
                      />
                    )
                    : null
                  }
                </View>
              )
            }
          </View>
        </ImageBackground>
      </ImageBackground>
    )
  }
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  boardContainer: {
    shadowRadius: 8,
    flex: 1,
    maxWidth: 710,
    marginHorizontal: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sidebar: {
    width: 184,
    padding: 15,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    overflow: 'visible'
  },
  unopenedPackContainer: {
    position: 'relative',
    marginVertical: 15,
    justifyContent: 'center',
    alignItems: 'stretch',
    width: cardStyles.cardContainer.width,
    height: cardStyles.cardContainer.height,
  },
  packCards: {
    width: (cardStyles.cardContainer.width + 23) * 3,
    flexWrap: 'wrap',
    flexDirection: 'row',
    zIndex: 5 // hover over OK button
  }
});

const mapStateToProps = state => ({
  user: state.user
});

export default connect(mapStateToProps)(OpenPacks);
