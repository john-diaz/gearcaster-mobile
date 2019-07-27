import io from 'socket.io-client';

// socket.io version 2.1.1 works. don't update it. please.
const socket = io('https://api.gearcaster.dev', {
  jsonp: false,
  transports: ['websocket'],
  autoConnect: false
});

socket.connect();

/* network events */
socket.on('connect', () => {
  console.info('[socket] connected to the server!');
});
socket.on('connect_error', (err) => {
  console.log('[socket]', err);
});
socket.on('disconnect', () => {
  console.info('[socket] disconnect from server');
});

/* custom events */
socket.on('userData', (data) => {
  console.log('[socket] got user data', data);
});

export default socket;
