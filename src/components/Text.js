import React, { Component } from 'react';
import { Text } from 'react-native';

export default class AppText extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return(
      <Text
        style={{
          fontFamily: this.props.bold ? 'lucida-grande-bold' : 'lucida-grande',
          color: 'white',
          fontSize: 12,
          ...(this.props.style ? this.props.style : {})
        }}
      >{this.props.children}</Text>
    )
  }
}