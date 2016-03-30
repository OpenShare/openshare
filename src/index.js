module.exports = (function() {

	var DataAttr = require('./modules/data-attr'),
		ShareAPI = require('./modules/share-api'),
		Events = require('./modules/events'),
		OpenShare = require('./modules/open-share'),
		Count = require('./modules/count'),
		ShareTransforms = require('./modules/share-transforms');

	DataAttr(OpenShare, Count, ShareTransforms, Events);
	return ShareAPI(OpenShare, ShareTransforms, Events);
})();
