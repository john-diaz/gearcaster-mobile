import React, { Component } from 'react';
import { TouchableOpacity, ImageBackground, View } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import globalStyles from '../../styles';
import Text from './Text';

let buttonPress = new Audio.Sound();
let buttonRelease = new Audio.Sound();
buttonPress.loadAsync(require('../../../assets/audio/ui/buttonpress.mp3'));
buttonRelease.loadAsync(require('../../../assets/audio/ui/buttonrelease.mp3'));

export default class AppButton extends Component {
  state = {
    activePress: false
  }
  render() {
    return (
      <View
        style={{
          ...(this.props.stoneContainer ? {
            position: 'relative',
            borderWidth: 4,
            borderTopWidth: 0,
            borderColor: '#373636',
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            padding: 5,
            overflow: 'hidden',
            justifyContent: 'center',
            alignContent: 'center'
          } : {}),
          shadowColor: 'black',
          shadowOpacity: 0.8,
          shadowRadius: 6,
          ...this.props.containerStyle
        }}
      >
        {
          this.props.stoneContainer
          ? <ImageBackground
              source={require('../../../assets/img/ui/backgrounds/stone-button.png')}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 5,
              }}
              imageStyle={{
                width: undefined,
                height: undefined,
                resizeMode: 'stretch'
              }}
            />
          : null
        }
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={this.props.onPress}
          onPressIn={() => {
            buttonPress.playFromPositionAsync(0);
            this.setState({ activePress: true });
          }}
          onPressOut={() => {
            buttonRelease.playFromPositionAsync(0);
            this.setState({ activePress: false });
          }}
          style={{zIndex: 10}}
        >
          <View
            style={{
              position: 'relative',
              borderRadius: 6,
              borderColor: !this.props.urgent ? '#BDA753' : '#bd7153',
              borderWidth: 2,
              paddingVertical: 10,
              paddingHorizontal: 15,
              alignItems: 'center',
              justifyContent: 'center',
              ...this.props.style
            }}
          >
            <LinearGradient
              colors={
                !this.props.urgent
                  ? !this.state.activePress
                    ? ['#DBC25E', '#A89548']
                    : ['#A89548', '#DBC25E']
                  : !this.state.activePress
                    ? ['#db775e', '#a84e48']
                    : ['#a84e48', '#db775e']
              }
              style={{...globalStyles.absoluteCenter, borderRadius: 4}}
            />
            { this.props.title ? <Text bold style={this.props.textStyle}>{this.props.title}</Text> : null }
            { this.props.children ? this.props.children : null }
          </View>
        </TouchableOpacity>
      </View>
    )
  }
}