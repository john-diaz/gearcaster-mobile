import React, { Component } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from '../custom';
import globalStyles from '../../styles';
import { Entypo } from '@expo/vector-icons';

export default class PlayerResources extends Component {
  _ismounted = false;
  state = {
    // animation data
    springs: { delta: 0, animation: new Animated.Value(0) },
    gears:   { delta: 0, animation: new Animated.Value(0) },
    energy:  { delta: 0, animation: new Animated.Value(0) },
    health:  { delta: 0, animation: new Animated.Value(0) },
  }
  componentDidMount() {
    this._ismounted = true;
  }
  componentWillUnmount() {
    this._ismounted = false;
  }
  componentDidUpdate(prevProps) {
    const { resources } = this.props;
    const prevResources = prevProps.resources;

    Object.keys(resources).forEach(resourceName => {
      const previous = prevResources[resourceName];
      const current = resources[resourceName];

      if (previous === current) return;
      console.log(resourceName, 'changed');

      const delta = current - previous;

      const resourceChange = this.state[resourceName];

      if (resourceChange.animation.stop) resourceChange.animation.stop();

      this.state[resourceName].delta = delta;
      this.setState(this.state);

      Animated.timing(resourceChange.animation, { // start animation
        fromValue: 0,
        toValue: 1,
        duration: 100
      }).start(() => {
        if (!this._ismounted) return;

        Animated.timing(resourceChange.animation, {
          toValue: 0,
          duration: 100,
          delay: 700
        }).start(() => {
          this.state[resourceName].delta = 0;
          this.setState(this.state);
        });
      });
    });
  }
  render() {
    return (
      <View style={styles.resourcesContainer}>
        {
          ['health', 'energy', 'gears', 'springs']
            .map((resource) =>
              <View key={resource} style={{...styles.resource, borderBottomWidth: resource !== 'springs' ? 1 : 0}}>
                <View 
                  style={{ 
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text
                    style={{
                      marginRight: 2,
                      color: resource === 'health' ? (this.props.resources.health <= 5 ? '#ff0017' : 'white')
                           : resource === 'energy' ? '#00fe52'
                           : resource === 'gears' ? '#d7d79a'
                           :'#00b1ef'
                    }}
                  >
                    {this.props.resources[resource]}
                  </Text>
                  <Entypo
                    name={
                      resource === 'health'
                        ? 'heart'
                        : resource === 'energy'
                        ? 'flash'
                        : resource === 'gears'
                        ? 'cog'
                        : 'flow-parallel'
                    }
                    color={
                        resource === 'health' ? '#e0bcbc'
                      : resource === 'energy' ? '#00fe52'
                      : resource === 'gears' ? '#d7d79a'
                      :'#00b1ef'
                    }
                    size={12}
                  />
                </View>

                {/* resource change bubble */}
                {
                  this.state[resource].delta
                    ? <View
                        style={{
                          ...styles.resourceBubble,
                          backgroundColor: this.state[resource].delta > 0 ? 'green' : 'red'
                        }}
                      >
                        <Text
                          bold
                          style={{ fontSize: 12 }}
                        >
                          {this.state[resource].delta > 0 ? '+' : ''}
                          {this.state[resource].delta}
                        </Text>
                      </View>
                    : null
                }
              </View>
            )
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  resourcesContainer: {
    ...globalStyles.fadedCobblebox,
    flex: 1,
    marginVertical: 7,
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  resource: {
    flex: 1,
    justifyContent: 'center',
    borderColor: '#C8C8C8',
    position: 'relative'
  },
  resourceBubble: {
    height: 24,
    width: 24,
    borderRadius: 24,
    position: 'absolute',
    right: -20,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
