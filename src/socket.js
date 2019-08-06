import { AsyncStorage } from 'react-native';
import io from 'socket.io-client';
import store from './store';
import navigationService from './navigationService';

// react native works best with socket.io version 2.1.1 (dont change)
const socket = io('http://192.168.1.5:3000', {
  jsonp: false,
  transports: ['websocket'],
  autoConnect: false // SOCKET IS INITIATED INSIDE APP.JS
});

let interruptedByAuthentication = false;

// socket events
socket.on('connect', () => {
  console.info('[socket] connected');

  store.dispatch({ type: 'SET_AUTH_STATUS', payload: 0 });
  authenticateSocket((user) => {
    console.info('[socket] attempt to authenticate socket', user ? 'was successful!' : 'failed!');

    store.dispatch({ type: 'SET_AUTH_STATUS', payload: user ? 1 : -1 });

    if (!user) {
      // first navigate to landing
      if (interruptedByAuthentication) {
        navigationService.goBack();
        interruptedByAuthentication = false;
      } else {
        navigationService.navigate('Landing');
      }
    } else {
      store.dispatch({ type: 'SET_USER', payload: user });
    }
  });
  store.dispatch({ type: 'SET_CONNECTION', payload: true });
});

function authenticateSocket(resolve) {
  AsyncStorage.getItem("userCredentials")
  .then(credentialsJSON => {
    if (!credentialsJSON) {
      return resolve(null);
    }

    const credentials = JSON.parse(credentialsJSON);
    socket.emit('user.authenticate', credentials, (err, user) => {
      if (err) {
        AsyncStorage.removeItem("userCredentials");
        resolve(null);
      } else {
        AsyncStorage.setItem("userCredentials", JSON.stringify({
          token: user.token, username: user.username
        }));
        resolve(user);
      }
    });
  })
  .catch(err => {
    resolve(null);
  });
}
socket.on('disconnect', () => {
  console.info('[socket] disconnected');
  store.dispatch({ type: 'SET_CONNECTION', payload: false });
});
socket.on('connect_error', (err) => {
  console.log('[socket] conn_error:', err);
});

// CUSTOM EVENTS
socket.on('userData', async (data) => {
  if (!data) {
    // avoid other screens rendering without a user
    await navigationService.navigate('Landing');
    // set flag
    interruptedByAuthentication = true;
  }

  if (data) {
    store.dispatch({
      type: 'SET_USER',
      payload: data
    });
  } else {
    store.dispatch({ type: 'SET_AUTH_STATUS', payload: -1 });
  }
});

export default socket;
