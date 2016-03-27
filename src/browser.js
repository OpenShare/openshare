module.exports = (function() {

	var DataAttr = require('./modules/data-attr'),
		API = require('./modules/api'),
		Events = require('./modules/events'),
		OpenShare = require('./modules/open-share'),
		Transforms = require('./modules/transforms'),
		Count = require('./modules/count');

	DataAttr(OpenShare, Count, Transforms, Events);
	window.OpenShare = API(OpenShare, Transforms, Events);
})();
