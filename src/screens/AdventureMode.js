import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { connect } from 'react-redux';
import { Button, Text, CustomAlert } from '../components/custom';
import { CardPack } from '../components/Duel/Card';
import images from '../images';
import globalStyles from '../styles';
import socket from '../socket';

class AdventureMode extends Component {
  _isfocused = false;

  componentDidMount() {
    this.focusSub = this.props.navigation.addListener('willFocus', () => {
      this._isfocused = true;
      this.checkForLose();
    });
    this.blurSub = this.focusSub = this.props.navigation.addListener('willBlur', () => {
      this._isfocused = false;
    });
  }
  componentWillUnmount() {
    this.focusSub.remove();
    this.blurSub.remove();
  }
  componentDidUpdate(prevProps) {
    if (this._isfocused) this.checkForLose();
  }
  checkForLose() {
    const { user } = this.props;
    if (user.adventureSession && user.adventureSession.active === false) {
      socket.emit('adventure.leave', (err, data) => {
        if (err) return Alert.alert(err);

        const { winPosition, level } = data;

        this.props.navigation.navigate('DeckConfiguration');

        // ALERT
        this.props.dispatch({
          type: 'SET_ALERT',
          payload: {
            component: (
              <CustomAlert title={winPosition ? "Success!" : "Defeat!"}>
                <Text bold style={{ textAlign: 'center' }}>You reached level { level } in adventure mode!</Text>
              </CustomAlert>
            )
          }
        })
      });
    }
  }
  enterAdventureDuel() {
    const adventureSession = this.props.user.adventureSession;

    socket.emit('adventure.startDuel', (err, gameID) => {
      if (err) Alert.alert(err);
      else {
        this.props.navigation.navigate('Duel', {
          gameID,
          selectedDeck: adventureSession.deckName
        });
      }
    });
  }
  showLootScreen() {
    this.props.dispatch({
      type: 'SET_ALERT',
      payload: {
        component: <LootAlert user={this.props.user} />
      }
    });
  }
  render() {
    const adventureSession = this.props.user.adventureSession;

    if (!adventureSession) return <View style={{ flex: 1, background: 'grey' }}/>
    return (
      <LinearGradient
        style={styles.boardContainer}
        colors={['#735720', '#513C12']}
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={require('../../assets/img/ui/backgrounds/adventure.png')}
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingBottom: 8
            }}
            resizeMode="cover"
          >
            <View
              style={{
                flexDirection: 'row',
                flex: 1,
                maxWidth: 710,
                marginHorizontal: 6,
                alignItems: 'stretch',
                justifyContent: 'space-between'
              }}
            >
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Button
                  stoneContainer
                  title='Loot'
                  containerStyle={{
                    width: '100%',
                    maxWidth: 150,
                    position: 'relative',
                    overflow: 'visible'
                  }}
                  onPress={() => this.showLootScreen()}
                >
                  <View
                    style={{
                      backgroundColor: '#FF3336',
                      borderColor: '#DBC25E',
                      borderWidth: 1,
                      borderRadius: 1,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                      position: 'absolute',
                      bottom: -9,
                      right: -14
                    }}
                  >
                    <Text bold style={{ fontSize: 12 }}>{adventureSession.loot.length}</Text>
                  </View>
                </Button>
              </View>
              <View style={{ flex: 1, alignItems: 'stretch' }}>
                <ImageBackground
                  source={require('../../assets/img/ui/backgrounds/stone-button.png')}
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1,
                    borderWidth: 4,
                    borderTopWidth: 0,
                    borderColor: '#373636',
                    borderBottomLeftRadius: 14,
                    borderBottomRightRadius: 14,
                    overflow: 'hidden'
                  }}
                  imageStyle={{
                    width: undefined,
                    height: undefined,
                    resizeMode: 'stretch'
                  }}
                >
                  <Text bold>
                    Adventure Mode
                  </Text>
                </ImageBackground>
              </View>
              <View style={{ flex: 1 }}>
                
              </View>
            </View>
          </ImageBackground>
        </View>
        {/* BOARD */}
        <View style={styles.board}>
          <View
            style={{
              flex: 1,
              alignItems: 'stretch',
            }}
          >
            <View style={{ position: 'relative', flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              {
                (
                  <View
                    style={{
                      ...globalStyles.absoluteCenter,
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 10000,
                    }}
                  >
                    <TouchableOpacity onPress={() => this.props.navigation.navigate('DeckConfiguration')}>
                      <View style={{...globalStyles.fadedCobblebox}}>
                        <Text style={{ fontSize: 16 }} bold>Configure Deck</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  )

              }
              <CardPack
                faction={adventureSession.deckName}
                containerStyle={{
                  width: 117,
                  height: 160
                }}
                imageStyle={{
                  width: 117,
                  height: 160,
                }}
              />
            </View>
            <Button
              title="ESCAPE WITH LOOT"
              urgent
              textStyle={{
                fontSize: 16
              }}
              onPress={() => {
                socket.emit('adventure.leave', (err, data) => {
                  if (err) return Alert.alert(err);

                  const { winPosition, level } = data;
                  this.props.navigation.navigate('DeckConfiguration');

                  // ALERT
                  this.props.dispatch({
                    type: 'SET_ALERT',
                    payload: {
                      component: (
                        <CustomAlert title={winPosition ? "Success!" : "Defeat!"}>
                          <Text bold style={{ textAlign: 'center' }}>You reached level { level } in adventure mode!</Text>
                        </CustomAlert>
                      )
                    }
                  })
                });
              }}
            />
          </View>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              marginVertical: 11
            }}
          >
            <Image
              source={images.avatars[adventureSession.currentChallenge.image]}
              style={{
                height: 140,
                width: 124,
                marginBottom: 22,
                borderColor: 'black',
                borderWidth: 4,
                borderRadius: 16
              }}
              imageStyle={{
                width: undefined,
                height: undefined
              }}
              resizeMode='cover'
            />
            <View style={globalStyles.fadedCobblebox}>
              <Text bold style={{ fontSize: 16, textAlign: 'center' }}>{adventureSession.currentChallenge.name}</Text>
              <Text bold style={{ fontSize: 14, textAlign: 'center' }}>challenge {adventureSession.level}/5</Text>
            </View>
          </View>
          <View
            style={{
              flex: 1,
              alignSelf: 'stretch',
              alignItems: 'stretch'
            }}
          >
            <ImageBackground
              source={require('../../assets/img/ui/backgrounds/adventure-description.png')}
              style={{
                flex: 1,
                padding: 24
              }}
              imageStyle={{
                height: undefined,
                width: undefined
              }}
              resizeMode='stretch'
            >
              <Text bold style={{ fontSize: 16, flex: 1, lineHeight: 18 }}>
                {adventureSession.currentChallenge.description}
              </Text>
              <ImageBackground
                source={require('../../assets/img/ui/backgrounds/stone-ellipse.png')}
                style={{
                  height: 110,
                  width: 110,
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center'
                }}
                imageStyle={{ height: null, width: null }}
                resizeMode='stretch'
              >
                <Button
                  title={
                    this.props.user.adventureSession.level === 5
                    ? 'WIP.'
                    : this.props.user.adventureSession.gameID
                      ? 'Resume'
                      : 'Play'
                  }
                  disabled={this.props.user.adventureSession.level === 5 || !this.props.user.adventureSession.active}
                  containerStyle={{
                    padding: 0,
                    overflow: 'hidden'
                  }}
                  style={{
                    borderRadius: 70,
                    height: 70,
                    width: 70,
                    padding: 0,
                    margin: 0,
                    overflow: 'hidden'
                  }}

                  charged

                  onPress={() => this.enterAdventureDuel()}
                />
              </ImageBackground>
            </ImageBackground>
          </View>
        </View>
      </LinearGradient>
    )
  }
}

const styles = StyleSheet.create({
  boardContainer: {
    flex: 1,
    borderColor: '#4F4F4F',
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    position: 'absolute',
    alignItems: 'stretch',
    top: 0,
    left: -8,
    right: -8,
    backgroundColor: 'rgba(79,79,79,0.75)',
    paddingBottom: 6,
    zIndex: 10
  },
  board: {
    marginTop: 60,
    maxWidth: 710,
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 26,
    marginBottom: 26
  }
})

const mapStateToProps = state => ({
  user: state.user,
});

export default connect(mapStateToProps)(AdventureMode);

// LOOT ALERT COMPONENT
class LootAlert extends Component {
  render() {
    return (
      <CustomAlert title="Loot">
        {
          this.props.user.adventureSession.loot.length
          ? (
            <ScrollView
              style={{
                alignSelf: 'stretch',
                borderWidth: 2,
                borderColor: '#C8C8C8',
                borderRadius: 2,
                backgroundColor: '#7957D5'
              }}
              horizontal
            >
              {
                this.props.user.adventureSession.loot.map((cardPack) =>
                  <View style={{ position: 'relative', overflow: 'visible', marginHorizontal: 20, justifyContent: 'center' }}>
                    <View
                      style={{
                        ...globalStyles.absoluteCenter,
                        justifyContent: 'center',
                        alignItems: 'stretch',
                        zIndex: 10,
                        left: -18,
                        right: -18
                      }}
                    >
                      <View style={{...globalStyles.fadedCobblebox, borderWidth: 2 }}>
                        <Text bold style={{ textAlign: 'center', fontSize: 10 }}>{cardPack.prefix} Deck</Text>
                      </View>
                    </View>
                    <CardPack
                      key={cardPack.id}
                      faction={cardPack.faction}
                    />
                  </View>
                )
              }
            </ScrollView>
          )
          : <Text bold style={{ flex: 1, textAlign: 'center' }}>No loot yet.</Text>
        }
        <View style={{ marginVertical: 12, alignSelf: 'stretch' }}/>
        <Text
          style={{
            textAlign: 'center'
          }}
          bold
        >
          If you lose a duel, you lose all of your loot! 
        </Text>
      </CustomAlert>
    )
  }
}
