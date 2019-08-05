import React, { Component } from 'react';
import {
  View,
  ImageBackground,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import { Audio } from 'expo-av';
import { connect } from 'react-redux';
import socket from '../socket';
import { Text, Spinner } from '../components/custom';
import PlayerResources from '../components/Duel/PlayerResources';
import globalStyles from '../styles';
import Sidebar from '../components/Duel/Sidebar';
import PlayerCard from '../components/Duel/PlayerCard';
import Card, { CardBack, styles as cardStyles } from '../components/Duel/Card';
import images from '../images';
import { arraysEqual } from '../helpers';
import PostDuel from '../components/Duel/PostDuel';

class Duel extends Component {
  _ismounted = false; // https://stackoverflow.com/questions/39767482/is-there-a-way-to-check-if-the-react-component-is-unmounted

  state = {
    attemptingJoin: false,
    // game state
    game: null,
    privateData: {},
    activeDiscoveryCards: [],
    virtualDuel: null,
    isAggro: [],
    logs: [],
    finishedInfo: null,
    // layout stuff
    benchLayout: { pageX: undefined, pageY: undefined, width: undefined, height: undefined },
    // animation stuff
    playercardAnim: new Animated.Value(1), // hidding/showing player cards in combat animation
    benchGlow: new Animated.Value(0), // indicating where to drop cards
    userErrorAnimation: new Animated.Value(0), // animation for user error
    userError: null
  }
  newDeckAudio = new Audio.Sound();

  componentWillMount() {
    this.newDeckAudio
      .loadAsync(require('../../assets/audio/ui/newDeck.mp3'))
      .then(() => {
        this.newDeckAudio.setVolumeAsync(0.1)
      });
  }
  componentDidMount() {
    this._ismounted = true;

    socket.on('gameData', (game) => {
      if (!this._ismounted) return;

      this.setState({ game });
    });

    socket.on('duelCombatInstructions', this.duelCombatInstructionsHandler);

    socket.on('privateData', (privateData) => {
      if (!this._ismounted) return;

      this.setState({ privateData });
    });

    socket.on('duelDiscovery', (data) => {
      if (!this._ismounted) return;

      const { payload } = data;

      if (payload.fromPlayer.id === this.props.user.id) return;

      if (this.state.activeDiscoveryCards.find(c => c.instanceID === payload.from.instanceID)) return; // jic

      this.setState({
        activeDiscoveryCards: [...this.state.activeDiscoveryCards, payload.from]
      });
      setTimeout(() => {
        if (!this._ismounted) return;
        this.setState({
          activeDiscoveryCards: this.state.activeDiscoveryCards.filter(d => d.id !== payload.from.id)
        });
      }, 4400);
    });

    this.joinGame();
  }
  componentDidUpdate(prevProps, prevState) {
    // previous update was authenticating. Now done authenticating AND there is a 
    // (if there is no user, app will automatically navigate to landing)
    if (prevProps.pendingAuth !== this.props.pendingAuth && this.props.user) {
      console.log('detected authentication change!');
      if (!this.state.attemptingJoin) {
        this.joinGame();
      }
    }

    const { game, privateData } = this.state;
    const computedDuel = game ? this.computedDuel : null;

    // compare selfPlayer.benches to play change sound effect
    if (
      game && computedDuel &&
      prevState.privateData.bench && privateData.bench
    ) {
      const currentHand = privateData.hand.map(c => c.instanceID);
      const previousHand = prevState.privateData.hand.map(c => c.instanceID);
  
      if (!arraysEqual(currentHand, previousHand)) {
        this.newDeckAudio.playFromPositionAsync(0);
      }
    }

    // check for game finished
    if (game && computedDuel && (computedDuel.finished && !this.state.finishedInfo)) {
      const { user } = this.props;
      const { players } = computedDuel;

      const selfWon = players.challenger.victoryPosition === "won" && user.id === players.challenger.id
        ? true
        : players.defendant.victoryPosition === "won" && user.id === players.defendant.id
          ? true
          : false;

      this.setState({
        finishedInfo: {
          selfWon,
          selfUser: this.props.user,
          players,
          rewardPacks: game.rewardPacks
        }
      });
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
      }
    });
  }
  duelCombatInstructionsHandler = (data) => {
    const { initialDuelState, combatInstructions } = data;

    if (this.state.virtualDuel) return false;
    this.setState({
      virtualDuel: initialDuelState,
      activeDiscoveryCards: []
    });

    Animated.timing(this.state.playercardAnim, {
      toValue: 0,
      duration: 600
    }).start();


    const stepDuration = 1700;

    for (let i = 0; i < combatInstructions.length; i++) {
      let timeOffset = stepDuration * (i + 1);
      let instruction = combatInstructions[i];

      setTimeout(() => {
        if (!this._ismounted) return;
        let newAggro = [
          ...this.state.isAggro,
          instruction.payload.from.id,
          instruction.payload.to.id
        ]

        this.playBotActiveFX();

        this.setState({ isAggro: newAggro });
      }, timeOffset);
      setTimeout(() => {
        if (!this._ismounted) return;
        this.applyCombatInstruction(instruction);
      }, timeOffset + 1300);
      setTimeout(() => {
        if (!this._ismounted) return;
        this.setState({ isAggro: [] });
      }, timeOffset + 500);
    }

    setTimeout(() => {
      Animated.timing(this.state.playercardAnim, {
        toValue: 1,
        duration: 100
      }).start();
      this.setState({ virtualDuel: null, isAggro: [] });
    }, (combatInstructions.length + 1) * stepDuration);
  }
  applyCombatInstruction = ({ type, payload, outcomeDuel }) => {
    switch (type) {
      case "machineToPlayerDamage":
        this.setState({
          virtualDuel: outcomeDuel,
          logs: [
            ...this.state.logs,
            { image: `cards/${payload.from.image}`, type, target: payload.to.id }
          ]
        });
        break;
      case "destroyMachine":
        this.setState({
          virtualDuel: outcomeDuel,
          logs: [
            ...this.state.logs,
            { image: `cards/${payload.from.image}`, type, target: payload.to.id }
          ]
        });
        break;
      case "machineSelfDestruction":
        this.setState({
          virtualDuel: outcomeDuel,
          logs: [
            ...this.state.logs,
            { image: `cards/${payload.from.image}`, type, target: "" }
          ]
        });
        break;
      case "mutualMachineDestruction":
        this.setState({
          virtualDuel: outcomeDuel,
          logs: [
            ...this.state.logs,
            { image: `cards/${payload.from.image}`, type, target: "" }
          ]
        });
        break;
    }
  }
  playBotActiveFX() {
    const bootingSounds = [
      require('../../assets/audio/ui/botActive1.mp3'),
      require('../../assets/audio/ui/botActive2.mp3'),
      require('../../assets/audio/ui/botActive3.mp3'),
      require('../../assets/audio/ui/botActive4.mp3'),
      require('../../assets/audio/ui/botActive5.mp3'),
      require('../../assets/audio/ui/botActive6.mp3'),
      require('../../assets/audio/ui/botActive7.mp3'),
      require('../../assets/audio/ui/botActive8.mp3'),
    ]
    const selectedSound = bootingSounds[Math.floor(Math.random() * bootingSounds.length - 1)];
    const audio = new Audio.Sound();
    audio.loadAsync(selectedSound).then(() => {
      audio.playAsync();
    });

    const damageAudio = new Audio.Sound();
    damageAudio.loadAsync(require('../../assets/audio/ui/damage.mp3')).then(() => {
      damageAudio.playAsync();
    });
  }
  get computedDuel() {
    return this.state.virtualDuel ? this.state.virtualDuel : this.state.game.duel;
  }
  get selfPlayer() {
      const userID = this.props.user.id;
      const duel = this.computedDuel;

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
    const duel = this.computedDuel;

    if (userID == duel.players.challenger.id) {
      return duel.players.defendant;
    } else {
      return duel.players.challenger;
    }
  }

  showUserError = (messageString) => {
    if (this._userErrorInterval) clearTimeout(this._userErrorInterval);

    this.setState({
      userError: messageString
    });
    Animated.spring(this.state.userErrorAnimation, {
      toValue: 1,
      duration: 1200,
      friction: 1.2
    }).start();

    this._userErrorInterval = setTimeout(() => {
      Animated.timing(this.state.userErrorAnimation, {
        toValue: 0,
        duration: 600,
      }).start(() => {
        if (!this._ismounted) return;
        if (this.state.userError === messageString) {
          this.setState({ userError: null });
        }
      });
    }, 2600)
  }

  render() {
    // loading screen
    if (!this.state.game || !this.computedDuel) return (
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
        {/* POST DUEL VIEW */}
        {
          this.state.finishedInfo
          ? <PostDuel {...this.state.finishedInfo} />
          : null
        }

        {/* JOIN ATTEMPT BANNER */}
        {
          this.state.attemptingJoin
          ? <View
            style={{
              ...globalStyles.cobbleBox,
              position: 'absolute',
              top: 15,
              margin: 'auto',
              width: 200,
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

        {/* USER ERROR BANNER */}
        {
          this.state.userError
          ? <Animated.View
              style={{
                ...globalStyles.cobbleBox,
                position: 'absolute',
                top: this.state.userErrorAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 10]
                }),
                margin: 'auto',
                width: 225,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
              }}
            >
              <Text bold style={{ color: 'red', fontSize: 16 }}>{this.state.userError}</Text>
            </Animated.View>
            : null
        }

        {/* BOARD CONTAINER */}
        <View style={styles.boardContainer}>
          <View style={styles.resourcesContainer}>
            <PlayerResources resources={this.opponentPlayer.resources}/>
            <PlayerResources resources={this.selfPlayer.resources}/>
          </View>
          {/* MAIN BOARD */}
          <View style={styles.board}>
            <PlayerCard
              opponent
              player={this.opponentPlayer}
              activeDiscoveryCards={this.state.activeDiscoveryCards}
              isAggro={this.state.isAggro.includes(this.opponentPlayer.id)}
              style={{
                transform: [{
                  translateY: this.state.playercardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0]
                  })
                }]
              }}
            />
            <PlayerCard
              player={this.selfPlayer}
              isAggro={this.state.isAggro.includes(this.selfPlayer.id)}
              style={{
                transform: [{
                  translateY: this.state.playercardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }]
              }}
            />

            {/* BENCHES */}
            <View style={{...styles.benchesContainer, zIndex: this.state.raiseBenches ? 49 : 1 }}>
              {/* OPPONENT BENCH */}
              <View style={styles.benchContainer}>
                {
                  Object.values(this.opponentPlayer.bench).map((card, i) => {
                    if (card._state.revealed) return (
                      <Card
                        key={card.instanceID}
                        card={card}
                        user={this.opponentPlayer}
                        isAggro={this.state.isAggro.includes(card.instanceID)}
                        location="bench-opponent"
                        onPressIn={() => this.setState({ raiseBenches: true })}
                        onPressOut={() => this.setState({ raiseBenches: false })}
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
              {/* BENCH DIVIDER */}
              <Animated.View
                style={{
                  flex: 0,
                  height: this.state.playercardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [105, 0]
                  })
                }}
              />
              {/* SELF BENCH */}
              <View
                style={styles.benchContainer}
                ref="benchRef"
                onLayout={(e) => {
                  this.refs.benchRef.measure((x, y, width, height, pageX, pageY) => {
                    this.setState({
                      benchLayout: { pageX, height, width, pageY }
                    })
                  })
                }}
              >
                {
                  Object.values(this.selfPlayer.bench.slice()).map((card, i) =>
                    <Card
                      key={card.instanceID}
                      card={card}
                      user={this.selfPlayer}
                      onPressIn={() => this.setState({ raiseBenches: true })}
                      onPressOut={() => this.setState({ raiseBenches: false })}
                      isAggro={this.state.isAggro.includes(card.instanceID)}
                      location="bench"
                    />
                  )
                }
                {
                  selfplayerEmptySlotsArray.map(() =>
                    <Animated.View
                      key={Math.random() * 1000}
                      style={{
                        ...styles.emptySpace,
                        borderColor: this.state.benchGlow.interpolate({
                          inputRange: [0, 150],
                          outputRange: [styles.emptySpace.borderColor, '	rgb(255,223,0)']
                        })
                      }}
                    />
                  )
                }
                {
                  this.selfPlayer.configuration.benchSize === 3
                    ? <View style={{...styles.emptySpace, borderWidth: 0 }}/>
                    : null
                }
              </View>
            </View>

            {
              this.computedDuel.finished
              ? null
              : <Animated.View
                  style={styles.selfHandContainer}
                >
                  <View style={styles.selfHand} >
                    {
                      this.selfPlayer.hand.filter(c => c).map((c, i) => {
                        const { length } = this.selfPlayer.hand.filter(c => c);

                        return (
                          <Card
                            card={c}
                            isAggro={this.state.isAggro.includes(c.instanceID)}
                            location="hand"
                            user={this.selfPlayer}
                            key={c.instanceID}
                            
                            onPressIn={() => this.setState({ raiseBenches: true })}
                            onPressOut={() => this.setState({ raiseBenches: false })}

                            dropArea={this.state.benchLayout}
                            onPickUp={() => {
                              Animated.spring(this.state.benchGlow, {
                                toValue: 150,
                                duration: 700
                              }).start();
                            }}
                            onDrop={(inBench, hasEnough) => {
                              Animated.spring(this.state.benchGlow, {
                                toValue: 0,
                                duration: 300
                              }).start();

                              if (inBench) {
                                if (hasEnough) {
                                  // play sound
                                  const castSound = new Audio.Sound();

                                  // cast
                                  socket.emit("duel.cast", c.instanceID, () => {
                                    castSound.loadAsync(
                                      c.kind === "discovery"
                                        ? require('../../assets/audio/ui/discoverycast.mp3')
                                        : require('../../assets/audio/ui/cardscrape.mp3')
                                    ).then(() => {
                                      castSound.playAsync();
                                    });
                                  });
                                } else {
                                  // animate show err
                                  this.showUserError('You do not have enough resources to cast this card!');
                                }
                              }
                            }}

                            style={{
                              zIndex: length-i,
                              position: 'absolute',
                              left: ((length * 38) - (38 * i)),
                            }}
                            imageStyle={{
                              transform: [
                                { translateY: (0.2*length) - (i * 0.4) },
                                { translateX: (0.4*length) - (i * 0.4)},
                                { rotateZ: `${(3*length) - (6 * i)}deg` }
                              ]
                            }}
                          />
                        )
                      })
                    }
                  </View>
                </Animated.View>
            }
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
    justifyContent: 'center',
    position: 'relative'
  },
  boardContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 710,
  },
  resourcesContainer: {
    zIndex: 10,
    width: 55,
    marginRight: 10,
    marginLeft: 10,
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  board: {
    zIndex: 5,
    marginLeft: 15,
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
    minHeight: 220,
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
    height: cardStyles.cardContainer.height - 1,
    width: cardStyles.cardContainer.width - 1,
    borderRadius: 6
  },
  selfHandContainer: {
    height: cardStyles.cardContainer.height,
    width: 230,
    position: 'absolute',
    bottom: -25,
    left: 260,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    zIndex: 50
  },
  selfHand: {
    height: cardStyles.cardContainer.height,
    width: 230,
    position: 'relative',
    margin: 'auto',
    paddingBottom: 10,
  }
});

const mapStateToProps = state => ({
  user: state.user,
  pendingAuth: state.pendingAuth
});

export default connect(mapStateToProps)(Duel);
