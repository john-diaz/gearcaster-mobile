import React, { Component } from 'react';
import { View, Image } from 'react-native';
import { Text, Button } from '../custom';
import socket from '../../socket';

export default class PlayerCard extends Component {
  _isMounted = false;

  state = {
    intervalTimeLeft: 0
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
  }
  render() {
    return(
      <View
        style={{
          width: 242,
          backgroundColor: 'rgba(255,255,255,0.73)',
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 50,
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
          )
        }}
      >
        <Image
          source={require('../../../assets/img/ui/card-covers/classic.png')}
          resizeMode='cover'
          style={{
            height: 68,
            width: 68,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 5,
            borderWidth: 5,
            borderColor: '#B4A68B',
            borderRadius: 10,
            marginRight: 7
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
          >{this.props.player.username}</Text>
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
                  ? <Button
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
                  />
                  : <Text bold style={{ color: '#444', fontSize: 16, marginTop: 5  }}>
                    [ Turn Ended ]
                  </Text>
          }
        </View>
      </View>
    )
  }
}
