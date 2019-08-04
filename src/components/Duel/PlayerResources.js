import React, { Component } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from '../custom';
import globalStyles from '../../styles';
import { Entypo } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import DeltaBubble from './DeltaBubble';
import { uuidv4 } from '../../helpers';

export default class PlayerResources extends Component {
  _ismounted = false;
  state = {
    // animation data
    gears:   { deltas: [] },
    health:  { deltas: [] },
  }
  healthAnim = new Animated.Value(1);

  componentDidMount() {
    this._ismounted = true;
  }
  componentWillUnmount() {
    this._ismounted = false;
  }
  componentDidUpdate(prevProps) {
    const prevResources = prevProps.resources;
    const { resources } = this.props;

    Object.keys(resources).forEach(resourceName => {
      const prev = prevResources[resourceName];
      const current = resources[resourceName];

      if (prev !== current) {
        const delta = current - prev;
        const uuid = uuidv4();

        if (resourceName === 'health') {
          Animated.timing(this.healthAnim, {
            toValue: current / 20,
            duration: 200
          }).start();
          if (delta > 0) {
            const healAudio = new Audio.Sound();
            healAudio.loadAsync(require('../../../assets/audio/ui/heal.mp3')).then(() => {
              healAudio.playAsync();
            });
          } else {
            const damageAudio = new Audio.Sound();
            damageAudio.loadAsync(require('../../../assets/audio/ui/damage.mp3')).then(() => {
              damageAudio.playAsync();
            });
          }
        }

        this.state[resourceName].deltas.push({ delta, uuid });
        this.setState(this.state);

        setTimeout(() => {
          if (!this._ismounted) return;
          this.state[resourceName].deltas = this.state[resourceName].deltas.filter(d => d.uuid !== uuid);
          this.setState(this.state);
        }, 900);
      }
    });
  }
  render() {
    const { resources } = this.props;

    return (
      <View style={styles.resourcesContainer}>
        {/* HEALTH BAR CONTAINER*/}
        <View style={styles.healthContainer}>
          <View
            style={{
              ...globalStyles.absoluteCenter,
              zIndex: 10,
              justifyContent: 'center',
              alignItems: 'center',
              alignItems: 'stretch'
            }}
          >
            <View style={{ position: 'relative' }}>
              <Text
                style={{
                  position: 'relative',
                  color: resources.health <= 5 ? 'red' : 'white',
                  textAlign: 'center'
                }}
                bold
              >
                <Entypo size={14} name='heart' color='white' /> {resources.health}
              </Text>
              {/* health delta bubble */}
              {
                this.state.health.deltas.map((d, i) => 
                  <DeltaBubble
                    delta={d.delta}
                    key={d.uuid}
                    style={{
                      transform: [{
                        translateX: 24 * i
                      }]
                    }}
                  />
                )
              }
            </View>
          </View>
          {/* HEALTH BAR */}
          <Animated.View
            style={{
              ...styles.healthBar,
              flex: this.healthAnim,
              zIndex: 5
            }}
          />
        </View>
        {/* GEARS */}
        <View
          style={{
            ...styles.gearsContainer,
            backgroundColor: resources.gears <= 0 ? '#444' : '#3399FF'
          }}
        >
          {/* change bubble */}
          {
            this.state.gears.deltas.map((d, i) => 
              <DeltaBubble
                delta={d.delta}
                key={d.uuid}
                style={{
                  transform: [{
                    translateX: 24 * i
                  }]
                }}
              />
            )
          }
          <Text
            style={{
              color: resources.gears <= 0 ? 'grey' : 'white',
              textAlign: 'center',
              fontSize: 16
            }}
            bold
          >
            <Entypo
              name="cog"
              size={14}
              color={resources.gears <= 0 ? 'grey' : 'white'}
            />
            {resources.gears}
          </Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  resourcesContainer: {
    ...globalStyles.fadedCobblebox,
    padding: 0,
    flex: 1,
    marginVertical: 7,
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  healthContainer: {
    flex: 1,
    alignItems: 'stretch',
    position: 'relative'
  },
  healthBar: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#F62C46'
  },
  gearsContainer: {
    position: 'relative',
    borderColor: '#4F4F4F',
    borderTopWidth: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    height: 40,
    backgroundColor: '#3399FF',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
