import { AsyncStorage } from 'react-native';
import io from 'socket.io-client';
import store from './store';
import navigationService from './navigationService';

// react native works best with socket.io version 2.1.1 (dont change)
const socket = io('https://api.gearcaster.dev', {
  jsonp: false,
  transports: ['websocket'],
  autoConnect: false // SOCKET IS INITIATED INSIDE APP.JS
});

// socket events
socket.on('connect', () => {
  console.info('socket connected');
  authenticateSocket((user) => {
    console.info('attempt to authenticate socket', user ? 'was successful' : 'failed');
    if (!user) {
      navigationService.navigate('Landing');
    }
  });
  store.dispatch({ type: 'SET_CONNECTION', payload: true });
});

function authenticateSocket(resolve) {
  AsyncStorage.getItem("userCredentials")
  .then(credentialsJSON => {
    if (!credentialsJSON) {
      store.dispatch({ type: 'SET_USER', payload: null });
      return resolve(null);
    }

    const credentials = JSON.parse(credentialsJSON);
    socket.emit('user.authenticate', credentials, (err, user) => {
      if (err) {
        store.dispatch({ type: 'SET_USER', payload: null });
        AsyncStorage.removeItem("userCredentials");
        resolve(null);
      } else {
        store.dispatch({ type: 'SET_USER', payload: user });
        AsyncStorage.setItem("userCredentials", JSON.stringify({
          token: user.token, username: user.username
        }));
        resolve(user);
      }
    });
  })
  .catch(err => {
    store.dispatch({ type: 'SET_USER', payload: null });
    resolve(null);
  });
}
socket.on('disconnect', () => {
  console.info('socket disconnected');
  store.dispatch({ type: 'SET_CONNECTION', payload: false });
});
socket.on('connect_error', (err) => {
  console.log('socket error:', err);
});

// CUSTOM EVENTS
socket.on('userData', (data) => {
  store.dispatch({
    type: 'SET_USER',
    payload: data ? data : null
  });
});

export default socket;
