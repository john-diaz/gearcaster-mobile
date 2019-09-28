import React, { PureComponent } from 'react';
import { View, TouchableHighlight, Alert } from 'react-native';
import globalStyles from '../../styles';
import { Entypo } from '@expo/vector-icons';
import { CustomAlert, Button } from '../custom';
import socket from '../../socket';
import navigationService from '../../navigationService';
import store from '../../store';

export default class Sidebar extends PureComponent {
  leaveGame = () => {
    socket.emit("duel.leave", (err) => {
      store.dispatch({ type: 'SET_ALERT', payload: null })

      if (err) Alert.alert(err);
      else {
        const { game } = this.props;
        if (game.challenge && game.challenge.botConfig.difficulty === 0) {
          navigationService.navigate('Landing');
        } else {
          navigationService.navigate('AdventureMode')
        }
      }
    })
  }
  render() {
    return (
      <View
        style={{
          width: 50,
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: -30,
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <TouchableHighlight
          onPress={() => {
            store.dispatch({
              type: 'SET_ALERT',
              payload: {
                component: <SettingsModal leaveGame={this.leaveGame}/>
              }
            });
          }}
        >
          <View
            style={{
              ...globalStyles.fadedCobblebox,
              marginBottom: 18
            }}
          >
            <Entypo
              name="cog"
              color="white"
              size={16}
            />
          </View>
        </TouchableHighlight>
        <View
          style={{
            // ...globalStyles.fadedCobblebox,
            flex: 1,
            maxHeight: 265
          }}
        >

        </View>
      </View>
    )
  }
}

const SettingsModal = (props) => (
  <CustomAlert
    title="Game Menu"
  >
    <Button
      urgent
      title="Concede"
      onPress={props.leaveGame}
    />
  </CustomAlert>
)