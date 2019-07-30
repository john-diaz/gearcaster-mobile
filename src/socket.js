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

// socket events
socket.on('connect', () => {
  console.info('[socket] connected');

  authenticateSocket((user) => {
    console.info('[socket] attempt to authenticate socket', user ? 'was successful!' : 'failed!');

    if (!user) {
      // first navigate to landing
      navigationService.navigate('Landing');
      // after that, set the user (to avoid other screens rendering without a user)
      store.dispatch({ type: 'SET_USER', payload: user });
    }
  });
  store.dispatch({ type: 'SET_CONNECTION', payload: true });
});

function authenticateSocket(resolve) {
  store.dispatch({ type: 'SET_PENDING_AUTH', payload: true });
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
  })
  .finally(() => {
    store.dispatch({ type: 'SET_PENDING_AUTH', payload: false });
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
socket.on('userData', (data) => {
  if (!data) {
    // avoid other screens rendering without a user
    navigationService.navigate('Landing');
  }
  store.dispatch({
    type: 'SET_USER',
    payload: data ? data : null
  });
});

export default socket;
