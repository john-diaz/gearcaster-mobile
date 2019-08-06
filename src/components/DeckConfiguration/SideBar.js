import React, { Component } from 'react';
import {
  View,
  StyleSheet
} from 'react-native';
import { connect } from 'react-redux';
import { ScrollView } from 'react-native-gesture-handler';
import { Text } from '../custom'

class SideBar extends Component {
  render() {
    if (this.props.mode === "collection") {
      return (
        <View style={styles.sidebarContainer}>
          {/* HEADER */}
          <View style={styles.collectionHeader}>
            <Text bold>Choose a Deck</Text>
          </View>
          {/* LIST */}
          <ScrollView style={{ flex: 1 }}>

          </ScrollView>
        </View>
      )
    } else {
      return (
        <View />
      )
    }
  }
}

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 198,
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 6,
    borderColor: '#4F4F4F'
  },
  collectionHeader: {

  }
});

const mapStateToProps = state => ({
  user: state.user
});

export default connect(mapStateToProps, null)(SideBar);
