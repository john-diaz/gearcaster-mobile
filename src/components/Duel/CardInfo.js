import React, { PureComponent } from 'react';
import {
  View,
  StyleSheet,
  Animated
} from 'react-native';
import { Text } from '../custom';
import globalStyles from '../../styles';
import { CardBack } from './Card';
import { getRarityColor } from '../../helpers';
import { Entypo } from '@expo/vector-icons';

export default class CardInfo extends PureComponent {
  render() {
    const { card, location, resources } = this.props;
    const cost = card.attributes.castCost;

    return (
      <Animated.View
        style={{
          ...styles.cardInfoContainer,
          ...this.props.style,
          ...(
            location === 'hand'
              ? {
                  justifyContent: 'flex-start',
                  top: -90
                }
              : {}
            ),
          ...(
            location === 'collection' || location === 'bench'
            ? {
              top: -60,
              right: -100
            }
            : {}
          )
        }}
      >
        <View style={styles.cardInfo}>
          {/* card back preview */}
          <CardBack
            faction={card.faction}
            style={{ height: 30, width: 22, position: 'absolute', top: 4, right: 4, zIndex: 10 }}
            imageStyle={{ height: 30, width: 22, borderWidth: 1, borderRadius: 2 }}
          />

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
    borderRadius: 8,
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