import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Animated
} from 'react-native';
import { Text } from '../custom';
import globalStyles from '../../styles';
import { CardBack } from './Card';
import { capitalize, getRarityColor } from '../../helpers';
import { Entypo } from '@expo/vector-icons';

export default class CardInfo extends Component {
  render() {
    const { card, location, resources } = this.props;
    const cost = card.attributes.castCost;

    return (
      <Animated.View
        style={{
          ...styles.cardInfoContainer,
          ...this.props.style,
          ...(
            location === 'hand' || location === 'bench'
              ? {
                  justifyContent: 'flex-start',
                  top: -140
                }
              : {}
            )
        }}
      >
        <View style={styles.cardInfo}>
          <Text style={{ fontSize: 14 }} bold>{card.name} {
              card.rarity !== 'common'
                ? <Text
                    style={{
                      fontSize: 14,
                      color: getRarityColor(card.rarity)
                    }}
                    bold
                  >
                    {card.rarity.toUpperCase()}
                  </Text>
                : null
            }
          </Text>
          {
            location !== 'bench' && cost
              ? (
                  <Text style={styles.descriptionText}>
                    Cost: { Object.values(cost).reduce((a, b) => a + b) == 0 ? <Text>None</Text> : null }
                    {cost.gears ? <Text style={{...styles.descriptionText, color: resources.gears >= cost.gears ? 'white' : 'red'}}>
                      <Entypo name="cog" size={12} color={'white'} /> {cost.gears}
                    </Text> : null}
                    {cost.health ? <Text style={{...styles.descriptionText, color: resources.health >= cost.health ? 'white' : 'red'}}>
                      <Entypo name="heart" size={12} color={'white'} /> {cost.health}
                    </Text> : null}
                  </Text>
                )
              : null
          }

          <View style={{ alignSelf: 'stretch', height: 1, backgroundColor: '#828282', marginVertical: 6 }} />

          {
            card.attributes.strength != undefined 
              ? <Text style={{ fontSize: 12, color: 'white', marginBottom: 3 }}>
                  <Entypo
                    size={12}
                    color={'white'}
                    name='controller-volume'
                  /> Strength: { card.attributes.strength }
                </Text>
              : null
          }
          {
            card.attributes.bootTurnsRequired
              ? <Text style={{ fontSize: 12, color: 'white', marginBottom: 3 }}>
                  <Entypo size={12} color={'white'} name='clock' />
                  { location != 'bench' ? ' Boot turns required:' : ' Turns till boot:' }
                  { location != 'bench' ? card.attributes.bootTurnsRequired : card._state.turnsTillBoot }
                </Text>
              : null
          }
          { card.description ? <Text style={{ fontSize: 12, color: '#B3B3B3' }}>{ card.description }</Text> : null }
          <View
            style={{ marginTop: 6, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-start' }}
          >
            <CardBack
              faction={card.faction}
              style={{ height: 38, width: 27, marginRight: 4 }}
              imageStyle={{ height: 38, width: 27, borderWidth: 1, borderRadius: 2 }}
            />
            <Text bold style={{ fontSize: 12, marginTop: 2 }}>{capitalize(card.faction)} deck</Text>
          </View>
        </View>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  cardInfoContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible'
  },
  cardInfo: {
    ...globalStyles.fadedCobblebox,
    padding: 8,
    minWidth: 200,
    borderColor: '#595959',
    borderWidth: 3,
    flexDirection: 'column',
    textAlign: 'left',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  descriptionText: { fontSize: 12, color: '#B3B3B3' }
})