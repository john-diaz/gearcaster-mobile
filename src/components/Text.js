import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

class AppText extends Component {
  render() {
    return(
      <Text
        style={{
          fontFamily: !this.props.fontLoaded ? undefined : this.props.bold ? 'lucida-grande-bold' : 'lucida-grande',
          color: 'white',
          fontSize: 12,
          ...(this.props.style ? this.props.style : {})
        }}
      >{this.props.children}</Text>
    )
  }
}

const mapStateToProps = state => ({ fontLoaded: state.fontLoaded });

export default connect(mapStateToProps)(AppText);
