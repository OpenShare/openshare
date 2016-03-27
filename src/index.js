module.exports = (function() {

	var DataAttr = require('./modules/data-attr'),
		API = require('./modules/api'),
		Events = require('./modules/events'),
		OpenShare = require('./modules/open-share'),
		Count = require('./modules/count'),
		ShareTransforms = require('./modules/share-transforms');

	DataAttr(OpenShare, Count, ShareTransforms, Events);
	return API(OpenShare, ShareTransforms, Events);
})();
