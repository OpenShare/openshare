import Init from '../../lib/init';
import share from '../../lib/initializeShareNode';
import count from '../../lib/initializeCountNode';

function init() {
  Init({
    selector: {
      share: '[data-open-share]:not([data-open-share-node])',
      count: '[data-open-share-count]:not([data-open-share-node])',
    },
    cb: {
      share,
      count,
    },
  })();
}
export default () => {
  if (document.readyState === 'complete') {
    return init();
  }
  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'complete') {
      init();
    }
  }, false);
};
