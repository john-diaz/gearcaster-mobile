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
import { Text, Spinner } from './src/components/custom';
// styles
import globalStyles from './src/styles';
import navigationService from './src/navigationService';

const AppNavigator = createStackNavigator(
  {
    Landing: LandingScreen,
    Duel: DuelScreen
  },
  {
    initialRouteName: 'Landing',
    headerMode: 'none',
    navigationOptions: {
      headerVisible: false,
    }
  }
);

const Navigation = createAppContainer(AppNavigator);

export default class App extends React.Component {
  state = {
    connection: false // socket.io connection
  }
  componentDidMount() {
    console.info('App mounted, connecting socket');

    store.subscribe(() => {
      const storeState = store.getState();
      this.setState({ connection: storeState.connection });
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
            !this.state.connection ?
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
                <Text style={{ marginTop: 10, textAlign: 'center' }}>Disconnected from the server. Reconnecting...</Text>
              </View>
            </View>
            : null
          }
          {/* NAVIGATION CONTAINER */}
          <Navigation
            ref={nav =>  navigationService.setTopLevelNavigator(nav)}
          />
        </Provider>
      </View>
    )
  }
}