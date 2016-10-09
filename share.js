module.exports = (function () { // eslint-disable-line
  document.addEventListener('DOMContentLoaded', require('./lib/init')({
    api: 'share',
    selector: '[data-open-share]:not([data-open-share-node])',
    cb: require('./lib/initializeShareNode'),
  }));

  return require('./src/modules/share-api')();
}());
