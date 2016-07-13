module.exports = (function() {
	const DataAttr = require('./modules/data-attr')();
	const ShareAPI = require('./modules/share-api');
	const CountAPI = require('./modules/count-api');
	const analyticsAPI = require('./module/analytics-api');

	return {
		share: ShareAPI(),
		count: CountAPI(),
		analytics: analyticsAPI
	};
})();
