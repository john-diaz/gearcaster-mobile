import React, { Component } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ImageBackground
} from 'react-native';
import { connect } from 'react-redux';
import { Button, ArrowButton, Text } from '../components/custom';
import Sidebar from '../components/DeckConfiguration/SideBar';
import socket from '../socket';
import Card, { styles as cardStyles } from '../components/Duel/Card';
import { uuidv4 } from '../helpers';
import { Entypo, AntDesign } from '@expo/vector-icons';
import globalStyles from '../styles';

class DeckConfiguration extends Component {
  state = {
    collection: [],
    offsetIndex: 0,
    hoveringCard: null,
    mode: "collection" // | "deck"
  }
  componentDidMount() {
    socket.on('connect', () => this.loadCollection);

    this.loadCollection();
  }
  componentDidUpdate(prevProps) {
    if (!prevProps.user && !!this.props.user) {
      this.loadCollection();
    }
  }
  loadCollection() {
    const { user } = this.props;

    if (!user) return console.log('failed to load collection, unauthenticated');

    socket.emit('user.collection', user.username, (err, collection) => {
      if (!err && collection) {
        collection = collection.map(c => ({ // give each card an instanceID for rendering
          ...c,
          instanceID: uuidv4()
        }));
        this.setState({ collection });
      } else {
        console.warn(err);
      }
    });
  }

  sampleCards(offsetIndex) {
    const { collection } = this.state;
    const offsetLength = 8;

    return collection.slice(offsetIndex * offsetLength, offsetIndex * offsetLength + offsetLength);
  }
  
  render() {
    const sampleCards = this.sampleCards(this.state.offsetIndex);

    return (
      <View style={{ flex: 1, backgroundColor: '#776969' }}>
        <View style={styles.deckConfigurationView}>
          {/* HEADER */}
          <View style={styles.headerContainer}>
            <ImageBackground
              source={require('../../assets/img/ui/backgrounds/tatami-header.png')}
              style={{
                width: '100%',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'stretch',
                paddingBottom: 8
              }}
              resizeMode="cover"
            >
              <View
                style={{
                  flexDirection: 'row',
                  maxWidth: 710,
                  marginHorizontal: 6,
                  alignItems: 'flex-start',
                  justifyContent: 'space-between'
                }}
              >
                <Button
                  title="Back"
                  stoneContainer
                  urgent
                  containerStyle={{
                    flex: 1
                  }}
                  onPress={() => this.props.navigation.navigate('Landing')}
                />
                <Button
                  title="Shop"
                  stoneContainer
                  containerStyle={{
                    flex: 2,
                    marginHorizontal: 15
                  }}
                />
                <Button
                  title="Open Packs"
                  stoneContainer
                  containerStyle={{
                    flex: 2,
                    marginHorizontal: 15
                  }}
                />
                <Button
                  title="Play"
                  stoneContainer
                  containerStyle={{
                    flex: 2
                  }}
                />
              </View>
            </ImageBackground>
          </View>

          {/* BOARD CONTAINER */}
          <View style={styles.boardContainer}>
            {/* MAIN CONTAINER BOARD */}
            <View style={styles.mainBoardContainer}>
              {/* LEFT PAGE BUTTON */}
              {this.state.offsetIndex > 0
                ? <View style={{...styles.nextPageButtonContainer, left: -16}}>
                    <ArrowButton
                      direction='left'
                      style={{
                        height: 38,
                        width: 48,
                      }}
                      onPress={() => {
                        this.setState({ offsetIndex: this.state.offsetIndex - 1 });
                      }}
                    />
                  </View>
                : null
              }

              {/* MAIN BOARD */}
              <ImageBackground
                style={styles.mainBoard}
                source={require('../../assets/img/ui/backgrounds/deckconfig-bg.png')}
                resizeMode="stretch"
              >
                <View style={styles.boardList}>
                  {
                    sampleCards.map((c) => {
                      return (
                        <View
                          style={{
                            marginHorizontal: 5,
                            zIndex: this.state.hoveringCard === c.instanceID ? 1000 : null
                          }}
                          key={c.instanceID}
                        >
                          <Card
                            card={c}
                            location={this.state.mode}
                            fadeInAnim={false}
                            user={{
                              resources: {
                                health: 10000,
                                gears: 10000
                              }
                            }}
                            onPressIn={() => this.setState({ hoveringCard: c.instanceID })}
                            onPressOut={() => this.setState({ hoveringCard: null })}
                          />
                          <View style={styles.quantityLabel}>
                            <Text bold style={{ fontSize: 12 }}>x{c.quantity}</Text>
                          </View>
                        </View>
                      )
                    }
                    )
                  }
                </View>
              </ImageBackground>

              {/* RIGHT PAGE BUTTON */}
              {this.sampleCards(this.state.offsetIndex + 1).length > 0
                ? <View style={{...styles.nextPageButtonContainer, right: -16 }}>
                    <ArrowButton
                      direction='right'
                      style={{
                        height: 38,
                        width: 48,
                      }}
                      onPress={() => {
                        this.setState({ offsetIndex: this.state.offsetIndex + 1 });
                      }}
                    />
                  </View>
                : null
              }
            </View>

            {/* BOARD SIDEBAR */}
            <Sidebar mode={this.state.mode}/>
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  deckConfigurationView: {
    overflow: 'visible',
    flex: 1,
    backgroundColor: '#351818',
    marginLeft: 6,
    marginRight: 6,
    paddingTop: 58,
  },
  headerContainer: {
    position: 'absolute',
    alignItems: 'stretch',
    top: 0,
    left: -6,
    right: -6,
    backgroundColor: 'rgba(79,79,79,0.75)',
    paddingBottom: 6,
    zIndex: 10
  },
  boardContainer: {
    maxWidth: 710,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    margin: 12,
    zIndex: 15
  },
  mainBoardContainer: {
    backgroundColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'stretch',
    borderRadius: 12,
    padding: 13,
    flex: 1,
    marginRight: 8,
    position: 'relative',
    zIndex: 10 // over the sidebar
  },
  mainBoard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    zIndex: 11, // hover over the page arrows
  },
  boardList: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: (4 * (cardStyles.cardContainer.width + 11)),
  },
  nextPageButtonContainer: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // hover over mainBoardContainer
  },
  quantityLabel: {
    ...globalStyles.cobbleBox,
    marginVertical: 3,
    borderWidth: 2,
    padding: 2,
    borderRadius: 3
  }
});

const mapStateToProps = state => ({
  user: state.user
});

export default connect(mapStateToProps, null)(DeckConfiguration);
