import React, { Component } from 'react';
import { View, ImageBackground, Text } from 'react-native';
import { connect } from 'react-redux';
import socket from '../socket';

class Duel extends Component {
  state = {
    game: null
  }
  componentDidMount() {
    const gameID = this.props.navigation.getParam('gameID');
    this.joinGame(gameID);
  }
  joinGame(gameID) {
    console.log('joining game', gameID);
  }
  render() {
    return (
      <ImageBackground
        source={require('../../assets/img/backgrounds/clouds.png')}
        style={{
          flex: 1,
          width: '100%',
          height: '100%'
        }}
      >
        <Text>Welcome, {this.props.user.username}</Text>
      </ImageBackground>
    )
  }
}

const mapStateToProps = state => ({ user: state.user });

export default connect(mapStateToProps)(Duel);
