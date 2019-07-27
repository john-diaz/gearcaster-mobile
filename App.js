import React from 'react';
import { View, StatusBar, AsyncStorage } from 'react-native';
import * as Font from 'expo-font';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import socket from './src/socket';
import LandingScreen from './src/screens/Landing';
import DuelScreen from './src/screens/Duel';
import Spinner from './src/components/Spinner';

const AppNavigator = createStackNavigator(
  {
    Duel: DuelScreen
  },
  {
    headerMode: 'none',
    navigationOptions: {
      headerVisible: false,
    }
  }
);

const AppContainer = createAppContainer(AppNavigator);
export default class App extends React.Component {
  state = {
    fontLoaded: false,
    user: undefined // undefined = loading, null = unauthenticated
  }
  componentDidMount() {
    console.clear();
    console.info('App did mount');

    // load custom fonts
    Font.loadAsync({
      'lucida-grande': require('./assets/fonts/LucidaGrande.ttf'),
      'lucida-grande-bold': require('./assets/fonts/LucidaGrandeBold.ttf')
    }).then(() => {
      // socket events
      socket.on('connect', () => this.authenticate());
      socket.on('userData', (data) => {
        if (data) {
          // set the user credentials
          if (!this.state.user) {
            console.info('setting user credentials');
            AsyncStorage.setItem("userCredentials", JSON.stringify({
              token: data.token, username: data.username
            }));
          }
          this.setState({ user: data });
        } else {
          this.setState({ user: null });
        }
      });

      // authenticate user
      this.authenticate();
    });
  }
  async authenticate() {
    const credentialsJSON = await AsyncStorage.getItem("userCredentials")
    if (!credentialsJSON) {
      this.setState({ user: null });
    } else {
      const credentials = JSON.parse(credentialsJSON);
      socket.emit('user.authenticate', credentials, (err) => {
        if (err) {
          this.setState({ user: null });
          AsyncStorage.removeItem("userCredentials");
        }
      });
    }
  }
  render() {
    return (
      <View style={{ flex: 1 }}>
        {/* HIDE THE STATUS BAR */}
        <StatusBar hidden={true} />
        {
          this.state.user === undefined
            ? <View
                style={{
                  flex: 1,
                  backgroundColor: '#444',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Spinner />
              </View>
            : this.state.user === null
              ? <LandingScreen />
              : <AppContainer />
        }
      </View>
    )
  }
}