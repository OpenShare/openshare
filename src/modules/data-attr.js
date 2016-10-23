import init from '../../lib/init';
import share from '../../lib/initializeShareNode';
import count from '../../lib/initializeCountNode';

export default () => {//eslint-disable-line
  document.addEventListener('DOMContentLoaded', init({
    selector: {
      share: '[data-open-share]:not([data-open-share-node])',
      count: '[data-open-share-count]:not([data-open-share-node])',
    },
    cb: {
      share,
      count,
    },
  }));
};
