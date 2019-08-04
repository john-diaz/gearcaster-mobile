export const hasEnoughResources = (bank, cost) => {
  // if it's free, the answer is always yes
  if (Object.values(cost).reduce((a, b) => a + b) == 0) {
    return true;
  }

  let subtractedResources = sumAttrs(bank, invertAttrs(cost));

  // check if any of the subtracted values fell below 0
  return !Object.values(subtractedResources).some(val => {
    return 0 > val;
  });
}

export const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export const sumAttrs = (...objs) => {
  return objs.reduce((accumulatorAttrs, keys) => {
    for (let k in keys) {
      if (keys.hasOwnProperty(k))
        accumulatorAttrs[k] = (accumulatorAttrs[k] || 0) + keys[k];
    }
    return accumulatorAttrs;
  }, {});
}

export function invertAttrs(...objs) {
  return objs.reduce((accumulatorAttrs, keys) => {
    for (let k in keys) {
      if (keys.hasOwnProperty(k))
        accumulatorAttrs[k] = (accumulatorAttrs[k] || 0) - keys[k];
    }
    return accumulatorAttrs;
  }, {});
}

export function arraysEqual(_arr1, _arr2) {
  if (!Array.isArray(_arr1) || ! Array.isArray(_arr2) || _arr1.length !== _arr2.length)
    return false;

  var arr1 = _arr1.concat().sort();
  var arr2 = _arr2.concat().sort();

  for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i])
          return false;
  }

  return true;
}

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c) => {
      let r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
}

export const getRarityColor = (rarity) => {
  return rarity === 'rare' ? '#7957D5'
        : rarity === 'epic' ? 'rgb(220, 255, 0)'
        : rarity === 'legendary' ? '#fcef78'
        : 'black'
}