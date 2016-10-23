export default () => {
  document.addEventListener('DOMContentLoaded', require('./lib/init')({
    api: 'count',
    selector: '[data-open-share-count]:not([data-open-share-node])',
    cb: require('./lib/initializeCountNode'),
  }));

  return require('./src/modules/count-api')();
};
