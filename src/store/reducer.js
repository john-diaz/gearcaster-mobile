import initialState from "./initialState";

import { Audio } from 'expo-av';

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_AUTH_STATUS':
      return ({ ...state, authStatus: action.payload });
    case 'FONT_LOADED':
      console.info('font loaded');
      return ({ ...state, fontLoaded: true });
    case 'SET_CONNECTION':
      return ({ ...state, connection: action.payload });
    case 'SET_USER':
      return ({ ...state, user: action.payload });
    case 'SET_AMBIENT':
      let oldAudio = state.ambient;

      const src = ambients[action.payload];
      if (!src) throw new Error('Could not find ambient music ' + action.payload);

      if (oldAudio && oldAudio.name === action.payload) return state;

      const audio = new Audio.Sound();

      audio.loadAsync(src, {
        shouldPlay: true,
        volume: 0.2,
        isLooping: true,
      }).then(() => {
        if (oldAudio) {
          oldAudio.audio.stopAsync();
          oldAudio.audio.unloadAsync();
        }
      });
      audio.setIsLoopingAsync(true);
      audio.setVolumeAsync(0.4);

      return ({ ...state, ambient: { name: action.payload, audio } });
    case 'SET_ALERT':
      return ({ ...state, customAlert: action.payload });
    default:
      return state;
  }
}

export const ambients = {
  DEFAULT: require('../../assets/audio/ambient/default.mp3'),
  DUEL: require('../../assets/audio/ambient/in-duel.mp3'),
  INTERMEDIATE: require('../../assets/audio/ambient/intermediate.mp3'),
}