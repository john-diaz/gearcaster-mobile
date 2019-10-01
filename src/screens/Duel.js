import React, { Component } from 'react';
import {
  View,
  ImageBackground,
  Alert,
  StyleSheet,
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
import Dialogue from '../components/Duel/Dialogue';

class Duel extends Component {
  _ismounted = false; // https://stackoverflow.com/questions/39767482/is-there-a-way-to-check-if-the-react-component-is-unmounted

  state = {} // set in `this.init()` to this_initialState because React Navigation does not re-mount the component

  _initialState = {
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
    tutorialPhase: null,
    // animation stuff
    playercardAnim: new Animated.Value(1), // hidding/showing player cards in combat animation
    benchGlow: new Animated.Value(0), // indicating where to drop cards
    userErrorAnimation: new Animated.Value(0), // animation for user error
    userError: null
  }

  componentDidMount() {
    this._ismounted = true;
    this.willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      () => {
        this.init();
      }
    );
    this.willBlurSubscription = this.props.navigation.addListener(
      'willBlur',
      () => {
        this.unload();
      }
    );
  }
  init() {
    this.props.dispatch({ type: 'SET_AMBIENT', payload: 'DUEL' });

    this.setState({...this._initialState}); // force reset on state when navigating

    socket.on('gameData', (game) => {
      if (!this._ismounted) return;

      const prevState = {...this.state};
      this.setState({ game }, () => {
        if (!prevState.game && game.challenge.botConfig.difficulty === 0) {
          this.initTutorial();
        }
      });
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
  unload() {
    socket.emit("duel.leave");
    this.props.dispatch({ type: 'SET_AMBIENT', payload: 'DEFAULT' });
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
    this.willFocusSubscription.remove();
    this.willBlurSubscription.remove();

    this.unload();
  }
  joinGame() {
    const gameID = this.props.navigation.getParam('gameID');
    const selectedDeck = this.props.navigation.getParam('selectedDeck');
    
    this.setState({ attemptingJoin: true });
    console.log('joining game');

    // this is a new duel, specify your selectedDeck
    if (gameID && selectedDeck) {
      socket.emit('duel.join', gameID, selectedDeck, (err) => {
        if (!this._ismounted) return;
  
        this.setState({ attemptingJoin: false });
        if (err) {
          Alert.alert(err);
          this.props.navigation.goBack();
        }
      });
    }
    // this is an existing duel, resume it
    else {
      socket.emit('duel.resume', (err) => {
        if (!this._ismounted) return;
  
        this.setState({ attemptingJoin: false });
        if (err) {
          Alert.alert(err);
          this.props.navigation.goBack();
        }
      });
    }
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
      duration: 600,
      // useNativeDriver: true, not supported
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
        duration: 100,
        // useNativeDriver: true, not supported
      }).start();
      this.setState({ virtualDuel: null, isAggro: [] }, this.onFinishCombatIntructions);
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
  onTurnEnded() {
    const { tutorialPhase } = this.state;
    if (tutorialPhase && tutorialPhase.step === 'INTRO_ENDTURN') { // TUTORIAL EVENT
      this.setState({ tutorialPhase: tutorialPhases['PENDING_FIRSTCOMBAT'] });
    }
    else if (tutorialPhase && tutorialPhase.step === 'ENDTURN-2') { // TUTORIAL EVENT
      this.setState({ tutorialPhase: tutorialPhases['PENDING_INTRO_STRENGTH'] });
    }
  }
  onFinishCombatIntructions() {
    const { tutorialPhase } = this.state;

    if (tutorialPhase && tutorialPhase.step === 'PENDING_FIRSTCOMBAT') { // TUTORIAL EVENT
      this.setState({ tutorialPhase: tutorialPhases['INTRO_ENEMYHEALTH'] });
    }
    if (tutorialPhase && tutorialPhase.step === 'PENDING_INTRO_STRENGTH') { // TUTORIAL EVENT
      this.setState({ tutorialPhase: tutorialPhases['INTRO_STRENGTH'] });
    }
    if (tutorialPhase && tutorialPhase.step === 'PENDING_INTRO_DISCOVERY') {
      this.setState({ tutorialPhase: tutorialPhases['INTRO_DISCOVERY'] });
    }
    if (tutorialPhase && tutorialPhase.step === 'PENDING_WINGIT') {
      this.setState({ tutorialPhase: tutorialPhases['WINGIT'] });
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

    new Audio.Sound().loadAsync(selectedSound, { shouldPlay: true });
    new Audio.Sound().loadAsync(require('../../assets/audio/ui/damage.mp3'), { shouldPlay: true });
  }
  get computedDuel() {
    return this.state.virtualDuel ? this.state.virtualDuel : this.state.game.duel;
  }
  get selfPlayer() {
      const userID = this.props.user.id;
      const duel = this.computedDuel;

      if (!duel) throw new Error("ASSSSHOLE");

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
  get gameSelfPlayer() {
    const userID = this.props.user.id;
    const { game } = this.state;

    if (!game) return null;

    if (userID == game.challenger.id) {
      return game.challenger;
    } else {
      return game.defendant;
    }
  }
  get gameOpponent() {
    const userID = this.props.user.id;
    const { game } = this.state;

    if (!game) return null;

    if (userID == game.challenger.id) {
      return game.defendant;
    } else {
      return game.challenger;
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
      friction: 1.2,
      // useNativeDriver: true
    }).start();

    this._userErrorInterval = setTimeout(() => {
      Animated.timing(this.state.userErrorAnimation, {
        toValue: 0,
        duration: 600,
        // useNativeDriver: true
      }).start(() => {
        if (!this._ismounted) return;
        if (this.state.userError === messageString) {
          this.setState({ userError: null });
        }
      });
    }, 2600)
  }

  initTutorial() {
    if (
      !Object.values(this.opponentPlayer.bench).find(c => c) &&
      !Object.values(this.selfPlayer.bench).find(c => c)
    ) {
      this.props.dispatch({
        type: 'SET_ALERT',
        payload: {
          component: (
            <Dialogue
              text="Welcome to the Dojo. I will be guiding you through your first duel."
              onPress={() => {
                this.props.dispatch({ type: 'SET_ALERT', payload: null });
                this.setState({ tutorialPhase: tutorialPhases['INTRO_EXPLAIN'] });
              }}
            />
          )
        }
      });
    }
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

    const { tutorialPhase } = this.state;

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
            <PlayerResources
              resources={this.opponentPlayer.resources}
              tutorialPhase={tutorialPhase}
              opponent
            />
            <PlayerResources
              resources={this.selfPlayer.resources}
              tutorialPhase={tutorialPhase}
            />
          </View>
          {/* MAIN BOARD */}
          <View style={styles.board}>
            {/* TUTORIAL DIALOGUE */}
            {
              tutorialPhase && tutorialPhase.dialogue 
              ? (
                <Dialogue
                  small
                  text={tutorialPhase.dialogue.text}
                  style={{
                    position: 'absolute',
                    marginHorizontal: 30,
                    left: 0,
                    right: 0,
                    ...(tutorialPhase.dialogue.align === 'top' ? {
                      top: 10,
                    } : {}),
                    ...(tutorialPhase.dialogue.align === 'bottom' ? {
                      bottom: 10,
                    } : {}),
                    zIndex: 60 // above everything else
                  }}
                  onPress={
                    tutorialPhase.hasOwnProperty('nextStep')
                    ? () => {
                        this.setState({ tutorialPhase: tutorialPhases[tutorialPhase.nextStep] })
                      }
                    : undefined
                  }
                />
              )
              : null
            }

            <PlayerCard
              opponent
              player={this.opponentPlayer}
              avatar={this.gameOpponent.avatar}
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
              avatar={this.gameSelfPlayer.avatar}
              isAggro={this.state.isAggro.includes(this.selfPlayer.id)}
              style={{
                transform: [{
                  translateY: this.state.playercardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }]
              }}

              tutorialPhase={tutorialPhase}
              onTurnEnded={() => this.onTurnEnded()}
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

                        style={{
                          height: styles.emptySpace.height,
                          width: styles.emptySpace.width,
                          marginRight: 12
                        }}
                        imageStyle={{
                          height: styles.emptySpace.height,
                          width: styles.emptySpace.width
                        }}
                      />
                    )
                    else return (
                      <CardBack
                        key={card.instanceID}
                        faction={card.faction}
                        style={{
                          height: styles.emptySpace.height,
                          width: styles.emptySpace.width,
                          marginRight: 12
                        }}
                        imageStyle={{
                          height: styles.emptySpace.height,
                          width: styles.emptySpace.width
                        }}
                      />
                    )
                  })
                }
                {
                  opponentEmptySlotsArray.map(() => {
                    return <View style={styles.emptySpace} key={Math.random() * 1000}/>;
                  })
                }
                {/* {
                  this.opponentPlayer.configuration.benchSize === 3
                    ? <View style={{...styles.emptySpace, borderWidth: 0 }}/>
                    : null
                } */}
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

                      tutorialPhaseStep={tutorialPhase ? tutorialPhase.step : null}

                      style={{
                        height: styles.emptySpace.height,
                        width: styles.emptySpace.width,
                        marginRight: 12
                      }}
                      imageStyle={{
                        height: styles.emptySpace.height,
                        width: styles.emptySpace.width
                      }}
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
                {/* {
                  this.selfPlayer.configuration.benchSize === 3
                    ? <View style={{...styles.emptySpace, borderWidth: 0 }}/>
                    : null
                } */}
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
                        const hand = this.selfPlayer.hand.filter(c => !!c);
                        const handIDs = hand.map(c => c.id);
                        const { length } = hand;

                        return (
                          <Card
                            card={c}
                            isAggro={this.state.isAggro.includes(c.instanceID)}
                            location="hand"
                            user={this.selfPlayer}
                            key={c.instanceID}
                            
                            onPressIn={() => this.setState({ raiseBenches: true })}
                            onPressOut={() => this.setState({ raiseBenches: false })}

                            tutorialPhaseStep={tutorialPhase ? tutorialPhase.step : null}

                            style={{
                              height: styles.emptySpace.height,
                              width: styles.emptySpace.width
                            }}
                            imageStyle={{
                              height: styles.emptySpace.height,
                              width: styles.emptySpace.width
                            }}

                            dropArea={this.state.benchLayout}
                            onPickUp={() => {
                              this.refs.benchRef.measure((x, y, width, height, pageX, pageY) => {
                                this.setState({
                                  benchLayout: { pageX, height, width, pageY }
                                })
                              });

                              Animated.spring(this.state.benchGlow, {
                                toValue: 150,
                                duration: 700,
                                // useNativeDriver: true, not supported
                              }).start();

                              // TUTORIAL EVENT
                              if (tutorialPhase) {
                                // intro cast
                                if (
                                  tutorialPhase.step === 'INTRO_CAST' && c.id === "Rapid Bot"
                                ) {
                                  this.setState({
                                    tutorialPhase: tutorialPhases['PENDING_CAST']
                                  });
                                } else if (
                                  tutorialPhase.step === 'INTRO_STRENGTH2'
                                ) {
                                  this.setState({
                                    tutorialPhase: tutorialPhases['PENDING_CAST2']
                                  });
                                } else if (
                                  tutorialPhase.step === 'INTRO_DISCOVERY'
                                ) {
                                  this.setState({
                                    tutorialPhase: tutorialPhases['PENDING_WINGIT']
                                  });
                                }
                              }
                            }}
                            onDrop={(inBench, hasEnough) => {
                              this.setState({ raiseBenches: false })
                              Animated.spring(this.state.benchGlow, {
                                toValue: 0,
                                duration: 300,
                                // useNativeDriver: true, not supported
                              }).start();

                              if (inBench) {
                                if (hasEnough) {
                                  // play sound
                                  const castSound = new Audio.Sound();

                                  // cast
                                  socket.emit("duel.cast", c.instanceID, () => {
                                    // play cast sound
                                    castSound.loadAsync(
                                      c.kind === "discovery"
                                        ? require('../../assets/audio/ui/discoverycast.mp3')
                                        : require('../../assets/audio/ui/cardscrape.mp3'),
                                      { shouldPlay: true })

                                    // TUTORIAL EVENT
                                    if (tutorialPhase) {
                                      let newHandIDs = handIDs.filter(id => id !== c.id);

                                      if (
                                        tutorialPhase.step === 'PENDING_CAST' && c.id === "Rapid Bot"
                                      ) {
                                        this.setState({
                                          tutorialPhase: tutorialPhases['INTRO_ENDTURN']
                                        });
                                      } else if (
                                        ['PENDING_CAST2', 'INTRO_BOOT'].includes(tutorialPhase.step)
                                      ) {
                                        // minion bot cast
                                        if (c.id === "Minion Bot") {
                                          this.setState({ tutorialPhase: tutorialPhases['INTRO_BOOT'] });
                                        }

                                        // both cast
                                        if (
                                          !newHandIDs.includes("Minion Bot") && !newHandIDs.includes("Aluminum Bot")
                                        ) {
                                          if (tutorialPhase.step !== 'INTRO_BOOT') {
                                            this.setState({ tutorialPhase: tutorialPhases['INTRO_BOOT_NEXT'] });
                                          } else {
                                            this.setState({ tutorialPhase: tutorialPhases['PENDING_INTRO_DISCOVERY'] });
                                          }
                                        }
                                      }
                                    }
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
            <Sidebar game={this.state.game}/>
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
    position: 'relative',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginRight: 35,
    minHeight: 220,
    width: 380
  },
  benchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1
  },
  emptySpace: {
    borderStyle: "dashed",
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 3,
    height: 90,
    width: 68,
    borderRadius: 6,
    marginRight: 12
  },
  selfHandContainer: {
    height: cardStyles.cardContainer.height,
    width: 230,
    position: 'absolute',
    bottom: 10,
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

const tutorialPhases = {
  'INTRO': {
    step: 'INTRO'
  },
  'INTRO_EXPLAIN': {
    step: 'INTRO_EXPLAIN',
    nextStep: 'INTRO_RESOURCES',
    dialogue: {
      text: 'In GearCaster, engineers create machines to protect them from enemy machines using their resources.'
    }
  },
  'INTRO_RESOURCES': {
    step: 'INTRO_RESOURCES',
    nextStep: 'INTRO_CAST',
    dialogue: {
      text: "These are your resources. Here you can see how much health and gears you have.",
      align: "top"
    }
  },
  'INTRO_CAST': {
    step: 'INTRO_CAST',
    dialogue: {
      text: "It looks like you have enough Gears to cast a Rapid Bot. Drag it onto the bench to start."
    }
  },
  'PENDING_CAST': {
    step: 'PENDING_CAST'
  },
  'INTRO_ENDTURN': {
    step: 'INTRO_ENDTURN',
    dialogue: {
      text: "We're ready to battle. End your turn to start!",
      align: 'top'
    }
  },
  'PENDING_FIRSTCOMBAT': {
    step: 'PENDING_FIRSTCOMBAT'
  },
  'INTRO_ENEMYHEALTH': {
    step: 'INTRO_ENEMYHEALTH',
    nextStep: 'ENDTURN-2',
    dialogue: {
      text: "You win by getting your enemy's health to 0."
    }
  },
  'ENDTURN-2': { // end the second turn
    step: 'ENDTURN-2',
    dialogue: {
      text: "It looks like you don't have enough resources to cast any cards. End your turn to continue."
    }
  },
  'PENDING_INTRO_STRENGTH': {
    step: 'PENDING_INTRO_STRENGTH'
  },
  'INTRO_STRENGTH': {
    step: 'INTRO_STRENGTH',
    nextStep: 'INTRO_STRENGTH2',
    dialogue: {
      text: "When in combat, the bot with the HIGHEST STRENGTH WILL WIN."
    }
  },
  'INTRO_STRENGTH2': {
    step: 'INTRO_STRENGTH2',
    dialogue: {
      text: "Aluminum Bots are very strong. Luckily, you have strong bots too. Summon them!"
    }
  },
  'PENDING_CAST2': {
    step: 'PENDING_CAST2'
  },
  // introduce card booting
  'INTRO_BOOT': {
    step: 'INTRO_BOOT',
    dialogue: {
      text: 'The Minion Bot requires 1 turn to boot before being able to attack.',
      align: 'top'
    }
  },
  'INTRO_BOOT_NEXT': {
    step: 'INTRO_BOOT_NEXT',
    nextStep: 'PENDING_INTRO_DISCOVERY',
    dialogue: {
      text: 'The Minion Bot requires 1 turn to boot before being able to attack.',
      align: 'top'
    }
  },
  // introduce discoveries
  'PENDING_INTRO_DISCOVERY': {
    step: 'PENDING_INTRO_DISCOVERY',
  },
  'INTRO_DISCOVERY': {
    step: 'INTRO_DISCOVERY',
    dialogue: {
      text: "A Discovery Card! Read it's description to find out what it does! You can only use it once, so make it count!",
      position: 'top'
    }
  },
  // end tutorial
  'PENDING_WINGIT': {
    step: 'PENDING_WINGIT'
  },
  'WINGIT': {
    step: 'WINGIT',
    nextStep: 'WINGIT2',
    dialogue: {
      text: "Well done- You've learned the basics of the game.",
    }
  },
  'WINGIT2': {
    step: 'WINGIT2',
    nextStep: 'WINGIT3',
    dialogue: {
      text: "GearCaster is a fast-paced game, so it might take a while to master it's mechanics."
    }
  },
  'WINGIT3': {
    step: 'WINGIT3',
    nextStep: null,
    dialogue: {
      text: "With enough practice, though, you too can master it. Welcome to GearCaster."
    }
  }
}