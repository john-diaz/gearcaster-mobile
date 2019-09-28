import React, { PureComponent } from 'react';
import {
  View,
  StyleSheet
} from 'react-native';
import store from '../../store';
import { Text, Button } from '.';

export default class CustomAlert extends PureComponent {
  render() {
    return (
      <View
        style={{
          backgroundColor: '#333',
          borderColor: '#828282',
          borderWidth: 3,
          borderRadius: 8,
          minWidth: 350,
          padding: 36,
          position: 'relative'
        }}
      >
        {
          this.props.title
          ? (
            <View
              style={{
                position: 'absolute',
                top: -(styles.modalHeader.minHeight / 2),
                left: 0,
                right: 0,
                alignItems: 'center'
              }}
            >
              <View style={styles.modalHeader}>
                <Text bold style={{ fontSize: 16, color: '#7957D5' }}>{this.props.title}</Text>
              </View>
            </View>
          )
          : null
        }
        
        {this.props.children}

        <View
          style={{
            position: 'absolute',
            bottom: -50,
            left: 0,
            right: 0,
            alignItems: 'center'
          }}
        >
          <Button
            onPress={() => store.dispatch({ type: 'SET_ALERT', payload: null })}
            title='OK'
            containerStyle={{
              minWidth: 80
            }}
          />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  modalHeader: {
    minWidth: 90,
    minHeight: 28,
    backgroundColor: '#BDBDBD',
    borderColor: '#828282',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
    paddingHorizontal: 8
  }
})