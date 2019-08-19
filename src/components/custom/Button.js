import React, { Component } from 'react';
import { TouchableOpacity, ImageBackground, View } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import globalStyles from '../../styles';
import Text from './Text';

export default class AppButton extends Component {
  state = {
    activePress: false
  }
  get gradientColors() {
    if (!this.shouldRespond) {
      return ['#828282', '#828282']
    } else if (this.props.urgent) {
      return !this.state.activePress ? ['#db775e', '#a84e48'] : ['#a84e48', '#db775e']
    } else if (this.props.charged) {
      return !this.state.activePress ? ['#33E1FF', '#55AA8A'] : ['#55AA8A', '#33E1FF']
    } else {
      return !this.state.activePress ? ['#DBC25E', '#A89548'] : ['#A89548', '#DBC25E']
    }
  }

  // lets the button know if it should respond when interacted with
  // it takes into account this.props.disabled
  // and this.props.tutorialPhase, if there is one
  get shouldRespond() {
    const { disabled, tutorialPhase } = this.props;

    if (disabled) return false;

    if (!tutorialPhase) {
      return true;
    } else if (
      [
        'INTRO_ENDTURN',
        'ENDTURN-2',
        'PENDING_INTRO_DISCOVERY',
        'PENDING_WINGIT'
      ].includes(tutorialPhase.step)
    ) {
      return true;
    }
    
    return false;
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
            padding: 3,
            paddingTop: 0,
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
          onPress={!this.shouldRespond ? undefined : this.props.onPress}
          onPressIn={() => {
            if (this.shouldRespond) {
              let buttonPress = new Audio.Sound();
              buttonPress.loadAsync(require('../../../assets/audio/ui/buttonpress.mp3'), { shouldPlay: true, volume: 0.6 });
              this.setState({ activePress: true });
            }
          }}
          onPressOut={() => {
            if (this.shouldRespond) {
              let buttonRelease = new Audio.Sound();
              buttonRelease.loadAsync(require('../../../assets/audio/ui/buttonrelease.mp3'), { shouldPlay: true });
              this.setState({ activePress: false });
            }
          }}
          style={{zIndex: 10}}
        >
          <View
            style={{
              position: 'relative',
              borderRadius: 6,
              ...(this.props.stoneContainer ? {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0
              } : {}),
              borderColor: (
                this.props.urgent ? '#bd7153'
                : this.props.charged ? '#39F'
                : !this.shouldRespond ? '#828282'
                : '#BDA753'
              ),
              borderWidth: 2,
              paddingVertical: 8,
              paddingHorizontal: 15,
              alignItems: 'center',
              justifyContent: 'center',
              ...this.props.style
            }}
          >
            <LinearGradient
              colors={this.gradientColors}
              style={{
                ...globalStyles.absoluteCenter,
                ...(this.props.stoneContainer ? {
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0
                } : {}),
              }}
            />
            { this.props.title ? <Text bold style={this.props.textStyle}>{this.props.title}</Text> : null }
            { this.props.children ? this.props.children : null }
          </View>
        </TouchableOpacity>
      </View>
    )
  }
}