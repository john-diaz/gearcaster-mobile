import React, { Component } from 'react';
import { View, ImageBackground, Alert, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { connect } from 'react-redux';
import socket from '../socket';
import { Text, Spinner } from '../components/custom';
import PlayerResources from '../components/Duel/PlayerResources';
import globalStyles from '../styles';
import Sidebar from '../components/Duel/Sidebar';
import PlayerCard from '../components/Duel/PlayerCard';
import Card, { CardBack } from '../components/Duel/Card';
import images from '../images';

class Duel extends Component {
  _ismounted= false; // https://stackoverflow.com/questions/39767482/is-there-a-way-to-check-if-the-react-component-is-unmounted

  state = {
    attemptingJoin: false,
    game: null,
    privateData: {}
  }
  componentDidMount() {
    this._ismounted = true;

    socket.on('gameData', (game) => {
      if (!this._ismounted) return;

      this.setState({ game });
    });

    socket.on('privateData', (privateData) => {
      if (!this._ismounted) return;

      this.setState({ privateData });
    });

    this.joinGame();
  }
  componentDidUpdate(prevProps) {
    // previous update was authenticating. Now done authenticating AND there is a 
    // (if there is no user, app will automatically navigate to landing)
    if (prevProps.pendingAuth && !this.props.pendingAuth && this.props.user) {
      console.log('detected authentication change!');
      if (!this.state.attemptingJoin) {
        this.joinGame();
      }
    }
  }
  componentWillUnmount() {
    this._ismounted = false;
    socket.emit("duel.leave");
  }
  joinGame() {
    const gameID = this.props.navigation.getParam('gameID');
    const selectedDeck = this.props.navigation.getParam('selectedDeck');

    this.setState({ attemptingJoin: true });
    
    console.log('joining game');

    socket.emit('duel.join', gameID, selectedDeck, (err) => {
      if (!this._ismounted) return;

      this.setState({ attemptingJoin: false });
      if (err) {
        Alert.alert(err);
        this.props.navigation.goBack();
      } else {
        console.log('joined duel successfully');
      }
    });
  }
  get selfPlayer() {
      const userID = this.props.user.id;
      const duel = this.state.game.duel;

      // when we are animating, the virtual duel will include both player's "private data"
      // this is to avoid overwriting the virtual duel private data with the private data the server sent us,
      // as it's ahead of what we are animating
      let privateData = this.state.virtualDuel ? {} : this.state.privateData;

      if (userID == duel.players.challenger.id) {
        return { ...duel.players.challenger, ...privateData };
      } else {
        return { ...duel.players.defendant, ...privateData };
      }
  }
  get opponentPlayer() {
    const userID = this.props.user.id;
    const duel = this.state.game.duel;

    if (userID == duel.players.challenger.id) {
      return duel.players.defendant;
    } else {
      return duel.players.challenger;
    }
  }
  render() {
    // loading screen
    if (!this.state.game || !this.state.game.duel) return (
      <ImageBackground
        source={require('../../assets/img/backgrounds/clouds.png')}
        style={{...styles.backgroundImage, alignItems: 'center' }}
      >
        <View style={{...globalStyles.fadedCobblebox, paddingHorizontal: 10}}>
          <Spinner />
        </View>
      </ImageBackground>
    );

    const opponentEmptySlots = Math.max(0, this.opponentPlayer.configuration.benchSize - this.opponentPlayer.bench.length);
    const opponentEmptySlotsArray = Array.apply(null, {length: opponentEmptySlots});

    const selfplayerEmptySlots = Math.max(0, this.selfPlayer.configuration.benchSize - this.selfPlayer.bench.length);
    const selfplayerEmptySlotsArray = Array.apply(null, {length: selfplayerEmptySlots});

    // game screen
    return (
      <ImageBackground
        source={require('../../assets/img/backgrounds/clouds.png')}
        style={styles.backgroundImage}
      >
        {
          this.state.attemptingJoin
          ? <View
            style={{
              ...globalStyles.cobbleBox,
              position: 'absolute',
              top: 15,
              margin: 'auto',
              height: 45,
              width: 175,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}
          >
            { this.state.attemptingJoin ? <Text>Connecting to Duel</Text> : null }
          </View>
          : null
        }

        <View style={styles.boardContainer}>
          <View style={styles.resourcesContainer}>
            <PlayerResources resources={this.opponentPlayer.resources}/>
            <PlayerResources resources={this.selfPlayer.resources}/>
          </View>
          {/* MAIN BOARD */}
          <View style={styles.board}>
            <PlayerCard player={this.opponentPlayer} opponent />
            <PlayerCard player={this.selfPlayer} />

            {/* BENCHES */}
            <View style={styles.benchesContainer}>
              {/* OPPONENT BENCH */}
              <View style={styles.benchContainer}>
                {
                  Object.values(this.opponentPlayer.bench).map((card, i) => {
                    if (card._state.revealed) return (
                      <Card
                        key={card.instanceID}
                        card={card}
                        player={this.opponentPlayer}
                        isAggro={false}
                        location="bench-opponent"
                      />
                    )
                    else return (
                      <CardBack
                        key={card.instanceID}
                        faction={card.faction}
                      />
                    )
                  })
                }
                {
                  opponentEmptySlotsArray.map(() => {
                    return <View style={styles.emptySpace} key={Math.random() * 1000}/>;
                  })
                }
                {
                  this.opponentPlayer.configuration.benchSize === 3
                    ? <View style={{...styles.emptySpace, borderWidth: 0 }}/>
                    : null
                }
              </View>
              {/* SELF BENCH */}
              <View style={styles.benchContainer}>
                {
                  this.selfPlayer.configuration.benchSize === 3
                    ? <View style={{...styles.emptySpace, borderWidth: 0 }}/>
                    : null
                }
                {
                  selfplayerEmptySlotsArray.map(() => {
                    return <View style={styles.emptySpace} key={Math.random() * 1000}/>;
                  })
                }
                {
                  Object.values(this.selfPlayer.bench.slice().reverse()).map((card, i) =>
                    <Card
                      key={card.instanceID}
                      card={card}
                      player={this.selfPlayer}
                      isAggro={false}
                      location="bench"
                    />
                  )
                }
              </View>
            </View>

            <Sidebar />
          </View>
        </View>
      </ImageBackground>
    )
  }
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center'
  },
  boardContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 710,
  },
  resourcesContainer: {
    width: 45,
    marginRight: 10,
    marginLeft: 10,
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  board: {
    flex: 1,
    backgroundColor: '#D3AE8C',
    borderColor: 'rgba(79,79,79,0.75)',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    marginRight: 30,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  benchesContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    marginRight: 35,
    height: 220,
    width: 380
  },
  benchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1
  },
  emptySpace: {
    borderStyle: "dashed",
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 3,
    height: 99,
    width: 73,
    borderRadius: 6
  }
});

const mapStateToProps = state => ({
  user: state.user,
  pendingAuth: state.pendingAuth
});

export default connect(mapStateToProps)(Duel);
