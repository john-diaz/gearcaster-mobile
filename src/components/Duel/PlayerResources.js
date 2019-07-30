import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../custom';
import globalStyles from '../../styles';
import { Entypo } from '@expo/vector-icons';

export default class PlayerResources extends Component {
  // componentDidUpdate(prevProps) {
  //   const { resources } = this.props;
  //   const prevResources = prevProps.resources;

  //   if (prevResources.health !== resources.health) {
  //     const healthDelta = resources.health - prevResources.health;
  //   }
  // }
  render() {
    return (
      <View
        style={{
          ...styles.resourcesContainer
        }}
      >
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
    borderColor: '#C8C8C8'
  }
});
