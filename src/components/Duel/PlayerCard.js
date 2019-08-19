import React, { Component } from 'react';
import { View, Image, Animated } from 'react-native';
import Card from './Card';
import { Text, Button } from '../custom';
import socket from '../../socket';
import images from '../../images';

export default class PlayerCard extends Component {
  _isMounted = false;

  state = {
    intervalTimeLeft: 0,
    aggroAnim: new Animated.Value(0)
  }
  componentDidMount() {
    this._isMounted = true;

    socket.on('turnDeadline', (data) => {
      if (!this._isMounted) return;

      if (this.interval) this.clearInterval();

      this.setState({ intervalTimeLeft: data.deadline });

      this.interval = setInterval(() => {
        if (!this._isMounted) return clearInterval(this.interval);

        this.setState({
          intervalTimeLeft: this.state.intervalTimeLeft - 1
        });

        if (this.state.intervalTimeLeft <= 0) {
          this.clearInterval();
        }
      }, 1000);
    });
  }
  componentDidUpdate(prevProps) {
    if (this.props.player.standingBy !== prevProps.player.standingBy) {
      if (!this.props.player.standingBy) {
        this.clearInterval();
      }
    }
    // agro animation
    if (prevProps.isAggro !== this.props.isAggro && this.props.isAggro) {
      Animated.timing(this.state.aggroAnim, {
        toValue: 1,
        duration: 100 // time to go aggro
      }).start(() => {
        if (!this._isMounted) return;
        Animated.timing(this.state.aggroAnim, {
          toValue: 0,
          duration: 100, // time to fade out
          delay: 1200 // time to show aggro
        }).start();
      });
    }
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  clearInterval() {
    this.setState({ intervalTimeLeft: 0 });
    clearInterval(this.interval);
    this.interval = null;
  }

  endTurn = () => {
    this.clearInterval();
    socket.emit("duel.endTurn");

    if (this.props.onTurnEnded) this.props.onTurnEnded();
  }
  render() {
    return(
      <Animated.View
        style={{
          width: 270,
          backgroundColor: 'rgba(255,255,255,0.73)',
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 48,
          position: 'absolute',
          left: 10,
          ...(this.props.opponent 
            ? { top: 0 }
            : { bottom: 0 }
          ),
          ...(this.props.opponent
            ? {
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10
            }
            : {
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10
            }
          ),
          ...this.props.style,
          transform: [
            ...(this.props.style ? this.props.style.transform : []),
            {
              translateY: this.state.aggroAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, this.props.opponent ? 100 : -100]
              })
            },
          ]
        }}
      >
        <Image
          source={images.avatars[this.props.avatar]}
          resizeMode='cover'
          style={{
            height: 68,
            width: 68,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 5,
            borderWidth: 5,
            borderColor: '#B4A68B',
            borderRadius: 10,
            marginRight: 7,
            ...(this.props.isAggro ? {
              shadowColor: 'red',
              shadowOpacity: 6,
              shadowRadius: 10
            } : {})
          }}
        />
        <View
          style={{
            alignSelf: 'stretch',
            flexDirection: 'column',
            flex: 1
          }}
        >
          <Text
            style={{ color: '#7957D5', fontSize: 16, marginTop: 5, marginBottom: 2 }}
            bold
          >{this.props.player.displayName}</Text>
          <Text
            style={{ color: '#828282', fontSize: 14 }}
            bold
          >{this.props.player.selectedDeck.toUpperCase()} DECK</Text>

          <View style={{ marginTop: 5 }} />

          {
            this.props.opponent
              ? this.props.player.standingBy // opponent player
                ? <Text bold style={{ color: '#444', fontSize: 16, marginTop: 5 }}>
                  [ Turn Ended ]
                </Text>
                : <Text style={{ color: '#444', fontSize: 16, marginTop: 5 }} bold>
                    Acting{this.state.intervalTimeLeft > 0 ? ` (${this.state.intervalTimeLeft} seconds!)` : '...'}
                  </Text>
              : !this.props.player.standingBy // self player
                  ? (
                    <Button
                      title={`End Turn ${ this.state.intervalTimeLeft > 0 ? `(${this.state.intervalTimeLeft})` : '' }`}
                      urgent={this.state.intervalTimeLeft > 0}
                      onPress={this.endTurn}
                      style={{
                        height: 32,
                        paddingVertical: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'stretch'
                      }}
                      textStyle={{
                        fontSize: 14
                      }}

                      tutorialPhase={this.props.tutorialPhase}
                    />
                  )
                  : <Text bold style={{ color: '#444', fontSize: 16, marginTop: 5  }}>
                    [ Turn Ended ]
                  </Text>
          }
        </View>
        
        {/* ACTIVE DISCOVERY CARDS */}
        {
          this.props.opponent
            ? this.props.activeDiscoveryCards.map((card, i) => 
              <Card
                isActiveDiscovery
                key={card.instanceID}
                user={this.props.player}
                card={card}
                style={{
                  transform: [
                    { translateX: i * 38 }
                  ]
                }}
              />
            )
            : null
        }
      </Animated.View>
    )
  }
}
