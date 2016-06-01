const initializeCountNode = require('./lib/initializeCountNode');
const init = require('./lib/init')({
	api: 'count',
	selector: '[data-open-share-count]:not([data-open-share-node])',
	cb: initializeCountNode
});

module.exports = (function() {
	document.addEventListener('DOMContentLoaded', init);
	return require('./src/modules/count-api')();
})();
