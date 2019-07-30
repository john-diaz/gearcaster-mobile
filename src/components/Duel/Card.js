import React, { Component } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Text } from '../custom';
import images from '../../images';

export default class Card extends Component {
  render() {
    return (
      <View
        style={styles.cardContainer}
      >
        <Image
          resizeMode='cover'
          style={styles.cardImage}
          source={images.cards[this.props.card.id]}
        />
      </View>
    )
  }
}

export class CardBack extends Component {
  render() {
    return (
      <View
        style={{...styles.cardContainer, borderWidth: 0 }}
      >
        <Image
          resizeMode='stretch'
          style={styles.cardImage}
          source={images.cardCovers[this.props.faction]}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  cardContainer: {
    height: 100,
    width: 74,
    position: 'relative'
  },
  cardImage: {
    height: 100,
    width: 74,
    borderWidth: 4,
    borderColor: 'black',
    borderRadius: 6,
    shadowRadius: 6,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 6,
    shadowOffset: { x: 0, y: 0 }
  }
})