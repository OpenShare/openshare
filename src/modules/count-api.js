/**
 * count API
 */

import count from './count';

export default () => { //eslint-disable-line
  // global OpenShare referencing internal class for instance generation
  class Count {

    constructor({
      type,
      url,
      appendTo = false,
      element,
      classes,
      key = null,
    }, cb) {
      const countNode = document.createElement(element || 'span');

      countNode.setAttribute('data-open-share-count', type);
      countNode.setAttribute('data-open-share-count-url', url);
      if (key) countNode.setAttribute('data-open-share-key', key);

      countNode.classList.add('open-share-count');

      if (classes && Array.isArray(classes)) {
        classes.forEach((cssCLass) => {
          countNode.classList.add(cssCLass);
        });
      }

      if (appendTo) {
        return new count(type, url).count(countNode, cb, appendTo);
      }

      return new count(type, url).count(countNode, cb);
    }
  }

  return Count;
};
