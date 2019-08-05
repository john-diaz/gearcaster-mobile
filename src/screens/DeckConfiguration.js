import React, { Component } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ImageBackground
} from 'react-native';
import { connect } from 'react-redux';

class DeckConfiguration extends Component {
  render() {
    return (
      <View style={styles.deckConfigurationView}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={require('../../assets/img/ui/backgrounds/tatami-header.png')}
            style={{
              width: '100%',
              height: 58
            }}
            resizeMode="cover"
          />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  deckConfigurationView: {
    flex: 1,
    backgroundColor: '#351818',
    borderColor: 'rgba(255,255,255,0.3)',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    paddingTop: 58,
  },
  headerContainer: {
    position: 'absolute',
    alignItems: 'stretch',
    top: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: 'rgba(79,79,79,0.75)',
    paddingBottom: 10,
    zIndex: 10
  }
});

const mapStateToProps = state => ({
  user: state.user
});

export default connect(mapStateToProps, null)(DeckConfiguration)