(function() {

	var DataAttr = require('./modules/data-attr'),
		API = require('./modules/api'),
		OpenShare = require('./modules/open-share'),
		Transforms = require('./modules/transforms'),
		Count = require('./modules/count');

	new DataAttr(OpenShare, Transforms, Count);
	new API(OpenShare, Transforms);
})();
