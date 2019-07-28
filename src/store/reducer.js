import initialState from "./initialState";

export default (state = initialState, action) => {
  switch (action.type) {
    case 'FONT_LOADED':
      console.info('font loaded');
      return ({ ...state, fontLoaded: true });
    case 'SET_CONNECTION':
      return ({ ...state, connection: action.payload });
    case 'SET_USER':
      console.log('set user', action.payload);
      return ({ ...state, user: action.payload });
    default:
      return state;
  }
}