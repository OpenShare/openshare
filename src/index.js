module.exports = (function () { //eslint-disable-line
  const DataAttr = require('./modules/data-attr')(); // eslint-disable-line
  const ShareAPI = require('./modules/share-api');
  const CountAPI = require('./modules/count-api');
  const analyticsAPI = require('../analytics');

  return {
    share: ShareAPI(),
    count: CountAPI(),
    analytics: analyticsAPI,
  };
}());
