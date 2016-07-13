module.exports = (function() {

	var DataAttr = require('./modules/data-attr'),
		ShareAPI = require('./modules/share-api'),
		Events = require('./modules/events'),
		OpenShare = require('./modules/open-share'),
		ShareTransforms = require('./modules/share-transforms'),
		Count = require('./modules/count'),
		CountAPI = require('./modules/count-api'),
		analyticsAPI = require('./module/analytics-api');

	DataAttr(OpenShare, Count, ShareTransforms, Events);
	window.OpenShare = {
		share: ShareAPI(OpenShare, ShareTransforms, Events),
		count: CountAPI(),
		analytics: analyticsAPI
	};
})();
