import React, { Component } from 'react';
import {
  View,
  Image,
  ImageBackground,
  Alert
} from 'react-native';
import socket from '../socket';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button } from '../components/custom';
import globalStyles from '../styles';

export default class Landing extends Component {
  constructor(props) {
    super(props);
  }
  startOnboarding() {
    console.log('create temp');
    socket.emit('user.createTempAccount', err => {
      console.log(err);
      if (err) {
        Alert.alert(err);
      } else {
        Alert.alert('Welcome!');
      }
    });
  }
  render() {
    return(
      <ImageBackground
        source={require('../../assets/img/backgrounds/landscape.png')}
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: 'black'
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
            maxWidth: 750,
            margin: 20,
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
              title="ENTER"
              onPress={this.startOnboarding}
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