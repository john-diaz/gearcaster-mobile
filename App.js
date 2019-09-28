import React from 'react';
import { View, StatusBar, AsyncStorage } from 'react-native';
// instabug import
// import Instabug from 'instabug-reactnative';
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
import OpenPacksScreen from './src/screens/OpenPacks';

import { Text, Spinner } from './src/components/custom';
// styles
import globalStyles from './src/styles';
import navigationService from './src/navigationService';
import AdventureMode from './src/screens/AdventureMode';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Platform } from '@unimodules/core';

const AppNavigator = createStackNavigator(
  {
    Landing: LandingScreen,
    Duel: DuelScreen,
    DeckConfiguration: DeckConfigurationScreen,
    OpenPacks: OpenPacksScreen,
    AdventureMode: AdventureMode
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
  return undefined;
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
    connection: false, // socket.io connection
    authStatus: null
  }
  constructor(props) {
    super(props);
    if (Platform.OS === 'ios') {
      // initiate Instabug
      // Instabug.startWithToken('b8620cc3af18f7e7cd7fd4eebf14e361', [Instabug.invocationEvent.shake]);
    }
  }
  componentDidMount() {
    console.info('App mounted, connecting socket');

    store.subscribe(() => {
      const storeState = store.getState();
      this.setState({
        user: storeState.user,
        connection: storeState.connection,
        authStatus: storeState.authStatus,
        customAlert: storeState.customAlert
      });
    });

    // socket is connected AFTER the navigationService is set by Navigation
    socket.connect();

    Font.loadAsync({
      'lucida-grande': require('./assets/fonts/LucidaGrande.ttf'),
      'lucida-grande-bold': require('./assets/fonts/LucidaGrandeBold.ttf')
    }).then(() => store.dispatch({ type: 'FONT_LOADED' }));

    store.dispatch({ type: 'SET_AMBIENT', payload: 'DEFAULT' });
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.authStatus !== 1 && this.state.authStatus === 1) {
      if (this.state.user.duelID) {
        // navigate to the duel screen without specifying a deck or gameID (indicator of resuming game)
        navigationService.navigate('Duel', { gameID: null, selectedDeck: null });
      }
    }
  }
  render() {
    return (
      <View style={{ flex: 1 }}>
        {/* HIDE THE STATUS BAR */}
        <StatusBar hidden={true} />

        {/* NAVIGATION */}
        <Provider store={store}>
          {/* CUSTOM ALERT */}
          {
            this.state.customAlert
            ? (
              <View
                style={{
                  ...globalStyles.absoluteCenter,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 1000,
                  padding: 60
                }}
              >
                {this.state.customAlert.component}
              </View>
            )
            : null
          }
          {/* CONNECTING MODAL */}
          {
            !this.state.connection || this.state.authStatus === 0 ?
            <View
              style={{
                ...globalStyles.absoluteCenter,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 2000
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