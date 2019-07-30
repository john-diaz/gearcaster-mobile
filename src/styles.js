import React, { Component } from 'react';
import { StyleSheet } from 'react-native';

const globalStyles = StyleSheet.create({
  absoluteCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  // cobbleBox
  cobbleBox: {
    backgroundColor: '#4F4F4F',
    borderColor: '#808080',
    borderWidth: 4,
    padding: 6,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fadedCobblebox: {
    backgroundColor: '#4F4F4F',
    borderColor: '#808080',
    borderWidth: 4,
    padding: 6,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderColor: '#595959',
  }
});

export default globalStyles;
