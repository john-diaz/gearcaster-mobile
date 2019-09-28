import React, { PureComponent } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated
} from 'react-native';
import globalStyles from '../../styles';
import images from '../../images';
import { Text, Button } from '../custom';

export default class Dialogue extends PureComponent {
  anim = new Animated.Value(0);

  componentDidMount() {
    Animated.timing(this.anim, { toValue: 1, duration: 1000, /*useNativeDriver: true, not supported*/ }).start();
  }
  render() {
    return (
      <View style={this.props.style}>
        <Animated.View
          style={{
            ...styles.container,
            scale: this.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [1.5, 1]
            }),
            opacity: this.anim,
            ...(this.props.small ? {
              marginHorizontal: 10,
              width: undefined,
              padding: 5
            } : {})
          }}
        >
          <Image
            source={images.avatars.who}
            style={{
              ...styles.avatar,
              ...(this.props.small ? {
                height: 50,
                width: 50
              } :{})
            }}
            resizeMode='cover'
          />
          <Text bold style={{ ...styles.text, flex: 0, color: '#7957D5' }}>Gear Master: </Text>
          <Text bold style={styles.text}>
            {this.props.text}
          </Text>
        </Animated.View>
        {
          this.props.onPress ?
          <Button
            title="Next"
            containerStyle={{ marginTop: 10, maxWidth: 88, alignSelf: 'center' }}
            onPress={this.props.onPress}
          />
          : null
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.cobbleBox,
    padding: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  avatar: {
    height: 100,
    width: 100,
    marginRight: 10,
    borderRadius: 10
  },
  text: {
    color: '#BFBFBF',
    flex: 1,
    fontSize: 16,
    marginTop: 6,
    textAlign: 'left'
  }
});
