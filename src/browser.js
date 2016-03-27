module.exports = (function() {

	var DataAttr = require('./modules/data-attr'),
		API = require('./modules/api'),
		Events = require('./modules/events'),
		OpenShare = require('./modules/open-share'),
		ShareTransforms = require('./modules/share-transforms'),
		Count = require('./modules/count');

	DataAttr(OpenShare, Count, ShareTransforms, Events);
	window.OpenShare = API(OpenShare, ShareTransforms, Events);
})();
