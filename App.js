import React from 'react';
import { View } from 'react-native';
import * as Font from 'expo-font';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import LandingScreen from './src/screens/Landing';

const AppNavigator = createStackNavigator(
  {
    Landing: LandingScreen
  },
  {
    initialRouteName: 'Landing',
    headerMode: 'none',
    navigationOptions: {
      headerVisible: false,
    }
  }
);

const AppContainer = createAppContainer(AppNavigator);
export default class App extends React.Component {
  state = {
    fontLoaded: false
  }
  async componentDidMount() {
    await Font.loadAsync({
      'lucida-grande': require('./assets/fonts/LucidaGrande.ttf'),
      'lucida-grande-bold': require('./assets/fonts/LucidaGrandeBold.ttf')
    });
    this.setState({ fontLoaded: true });
  }
  render() {
    return !this.state.fontLoaded
      ? <View style={{ flex: 1, backgroundColor: 'black' }}/>
      : <AppContainer />;
  }
}