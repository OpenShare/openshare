import Init from './lib/init';
import cb from './lib/initializeShareNode';
import countAPI from './src/modules/count-api';

function init() {
  Init({
    api: 'share',
    selector: '[data-open-share]:not([data-open-share-node])',
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
  return countAPI();
};
