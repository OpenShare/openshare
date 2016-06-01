const Events = require('./src/modules/events');
const initializeWatcher = require('./lib/initializeWatcher');
const initializeCountNode = require('./lib/initializeCountNode');

module.exports = (function() {
	document.addEventListener('DOMContentLoaded', init);
	return require('./src/modules/count-api')();
})();

function init() {
	initializeNodes();

	// check for mutation observers before using, IE11 only
	if (window.MutationObserver !== undefined) {
		initializeWatcher(document.querySelectorAll('[data-open-share-watch]'), initializeNodes);
	}
}

function initializeNodes(container = document) {
	// loop through count node collection
	let countNodes = container.querySelectorAll('[data-open-share-count]:not([data-open-share-node])');
	[].forEach.call(countNodes, initializeCountNode);

	// trigger completed event
	Events.trigger(document, 'count-loaded');
}
