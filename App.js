import React from 'react';
import { View, StatusBar, AsyncStorage } from 'react-native';
// app imports
import * as Font from 'expo-font';
import { createStackNavigator, createAppContainer, withNavigation } from 'react-navigation';
import socket from './src/socket';
// state management
import { Provider } from 'react-redux';
import store from './src/store';
// components
import LandingScreen from './src/screens/Landing';
import DuelScreen from './src/screens/Duel';
import DeckConfigurationScreen from './src/screens/DeckConfiguration';

import { Text, Spinner } from './src/components/custom';
// styles
import globalStyles from './src/styles';
import navigationService from './src/navigationService';

const AppNavigator = createStackNavigator(
  {
    Landing: LandingScreen,
    Duel: DuelScreen,
    DeckConfiguration: DeckConfigurationScreen,
  },
  {
    initialRouteName: 'Landing',
    headerMode: 'none',
    navigationOptions: {
      headerVisible: false,
    },
    defaultNavigationOptions: {
      gesturesEnabled: false,
    },
  }
);

const Navigation = createAppContainer(AppNavigator);

// https://reactnavigation.org/docs/en/state-persistence.html
// will persist the navigation state in development mode
const persistenceKey = "persistenceKey"
function getPersistenceFunctions() {
  return __DEV__ ? {
    async persistNavigationState(navState) {
      try {
        await AsyncStorage.setItem(persistenceKey, JSON.stringify(navState))
      } catch(err) {
        // watevs ^^
      }
    },
    async loadNavigationState() {
      const jsonString = await AsyncStorage.getItem(persistenceKey)
      return JSON.parse(jsonString)
    }
  } : undefined;
}

export default class App extends React.Component {
  state = {
    connection: false // socket.io connection
  }
  componentDidMount() {
    console.info('App mounted, connecting socket');

    store.subscribe(() => {
      const storeState = store.getState();
      this.setState({
        connection: storeState.connection,
        authStatus: storeState.authStatus
      });
    });

    // socket is connected AFTER the navigationService is set by Navigation
    socket.connect();

    Font.loadAsync({
      'lucida-grande': require('./assets/fonts/LucidaGrande.ttf'),
      'lucida-grande-bold': require('./assets/fonts/LucidaGrandeBold.ttf')
    }).then(() => store.dispatch({ type: 'FONT_LOADED' }));
  }
  render() {
    return (
      <View style={{ flex: 1 }}>
        {/* HIDE THE STATUS BAR */}
        <StatusBar hidden={true} />

        {/* NAVIGATION */}
        <Provider store={store}>
          {/* CONNECTING MODAL */}
          {
            !this.state.connection || this.state.authStatus === 0 ?
            <View
              style={{
                ...globalStyles.absoluteCenter,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1000
              }}
            >
              <View style={{
                ...globalStyles.cobbleBox,
                height: 100,
                width: 250,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Spinner />
                <Text style={{ marginTop: 10, textAlign: 'center' }}>
                  {
                    !this.state.connection
                      ? 'Disconnected from the server. Reconnecting...'
                      : 'Connected! Checking Authentication...'
                  }
                </Text>
              </View>
            </View>
            : null
          }
          {/* NAVIGATION CONTAINER */}
          <Navigation
            ref={nav =>  navigationService.setTopLevelNavigator(nav)}
            {...getPersistenceFunctions()}
          />
        </Provider>
      </View>
    )
  }
}