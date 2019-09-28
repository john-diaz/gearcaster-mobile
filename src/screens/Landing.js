import React, { Component } from 'react';
import {
  View,
  Image,
  ImageBackground,
  Alert,
  AsyncStorage,
  TouchableHighlight,
  Linking
} from 'react-native';
import socket from '../socket';
import { LinearGradient } from 'expo-linear-gradient';
import { connect } from 'react-redux';
import { Text, Button, CustomAlert } from '../components/custom';
import globalStyles from '../styles';
import { Entypo } from '@expo/vector-icons';

class Landing extends Component {
  enterGame = () => {
    const { needsToLearn } = this.props.user;

    if (needsToLearn.includes("intro-duel")) {
      this.startTutorialDuel();
    } else {
      this.props.navigation.navigate('DeckConfiguration');
    }
  }
  startOnboarding = () => {
    socket.emit('user.createTempAccount', async (err, user) => {
      if (err) {
        Alert.alert(err);
      } else {
        await AsyncStorage.setItem('userCredentials', JSON.stringify({
          username: user.username,
          token: user.token
        }));
        this.startTutorialDuel();
      }
    });
  }
  signOut = () => {
    AsyncStorage.removeItem('userCredentials').then(() => {
      this.props.dispatch({ type: 'SET_AUTH_STATUS', payload: -1 });
      this.props.dispatch({ type: 'SET_ALERT', payload: null });
    });
  }
  startTutorialDuel() {
    socket.emit('duel.new.tutorial', (err, gameID) => {
      if (err) Alert.alert(err);
      else this.props.navigation.navigate('Duel', { gameID, selectedDeck: 'classic' });
    });
  }
  render() {
    const { user } = this.props;

    return(
      <ImageBackground
        source={require('../../assets/img/backgrounds/landscape.png')}
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: 'black',
          padding: 20
        }}
      >
        <LinearGradient
          colors={['rgba(200,200,200,0)', 'rgba(0,0,0,0.65)']}
          locations={[0.2, 0.7]}
          style={{
            ...globalStyles.absoluteCenter,
            zIndex: 1
          }}
        />
        <View
          style={{
            zIndex: 10,
            flex: 1,
            width: '100%',
            maxWidth: 750,
            position: 'relative'
          }}
        >
          <Image
            source={require('../../assets/img/ui/icons/logo.png')}
            style={{
              height: 113,
              width: 168,
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
          { this.props.authStatus === 1
            ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  minWidth: 40,
                  paddingHorizontal: 15
                }}
              >
                <TouchableHighlight
                  onPress={() => Linking.openURL("https://discord.gg/BCCb6YG")}
                >
                  <View style={{ backgroundColor: '#6e85d3', padding: 10, borderRadius: 10, paddingHorizontal: 14, marginRight: 8 }}>
                    <Image
                      source={require('../../assets/img/ui/icons/discord-icon.png')}
                      style={{ width: 26, height: 18 }}
                      resizeMode="stretch"
                    />
                  </View>
                </TouchableHighlight>
                <TouchableHighlight
                  onPress={() => {
                    this.props.dispatch({
                      type: 'SET_ALERT',
                      payload: {
                        component: (<SettingsModal signOut={this.signOut} />)
                      }
                    })
                  }}
                >
                  <View
                    style={{...globalStyles.cobbleBox, paddingHorizontal: 14, alignSelf: 'stretch', height: null }}
                  >
                    <Entypo
                      name="cog"
                      color="white"
                      size={16}
                    />
                  </View>
                </TouchableHighlight>
              </View>
            )
            : null
          }
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                ...globalStyles.cobbleBox,
                width: 245,
                marginBottom: 20
              }}
            >
              <Text bold style={{ textAlign: 'center' }}>A fast-paced mechanical card game</Text>
            </View>
            <Button
              title={this.props.authStatus === 1 ? (user.duelID ? "RESUME" : "ENTER") : "START"}
              onPress={this.props.authStatus === 1 ? this.enterGame : this.startOnboarding}
              style={{
                minWidth: 193,
                minHeight: 41,
              }}
              textStyle={{
                fontSize: 16
              }}
            />
          </View>
        </View>
      </ImageBackground>
    )
  }
}

const mapStateToProps = state => ({ user: state.user, authStatus: state.authStatus });

export default connect(mapStateToProps, null)(Landing);

const SettingsModal = props => (
  <CustomAlert
    title="Main Menu"
  >
    <Button
      title="About GearCaster"
      onPress={() => Linking.openURL("https://gearcaster.dev/about") }
      style={{ marginBottom: 12 }}
    />
    <Button
      urgent
      onPress={() => props.signOut()}
      title="Reset Progress"
    />
  </CustomAlert>
)