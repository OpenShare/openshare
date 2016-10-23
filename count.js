import Init from './lib/init';
import cb from './lib/initializeCountNode';

function init() {
  Init({
    api: 'count',
    selector: '[data-open-share-count]:not([data-open-share-node])',
    cb,
  })();
}
export default () => {
  if (document.readyState === 'complete') {
    init();
  }
  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'complete') {
      init();
    }
  }, false);
  return require('./src/modules/count-api')();
};
