module.exports = (function() {
	const DataAttr = require('./modules/data-attr')();
	const ShareAPI = require('./modules/share-api');
	const CountAPI = require('./modules/count-api');

	return {
		share: ShareAPI(),
		count: CountAPI()
	};
})();
