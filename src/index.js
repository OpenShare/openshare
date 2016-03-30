module.exports = (function() {
	var DataAttr = require('./modules/data-attr'),
		ShareAPI = require('./modules/share-api');

	DataAttr();
	return ShareAPI();
})();
