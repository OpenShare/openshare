const initializeShareNode = require('./lib/initializeShareNode');
const init = require('./lib/init')({
	selector: '[data-open-share]:not([data-open-share-node])',
	cb: initializeShareNode
});

module.exports = (function() {
	document.addEventListener('DOMContentLoaded', init);
	return require('./src/modules/share-api')();
})();
