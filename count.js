var Count = require('./src/modules/count');
var Events = require('./src/modules/events');

module.exports = (function() {
	document.addEventListener('DOMContentLoaded', init);
	return require('./src/modules/count-api')();
})();

function init() {
	initializeNodes();

	// check for mutation observers before using, IE11 only
	if (window.MutationObserver !== undefined) {
		initializeWatcher(document.querySelectorAll('[data-open-share-watch]'));
	}
}

function initializeNodes(container = document) {
	// loop through count node collection
	let countNodes = container.querySelectorAll('[data-open-share-count]:not([data-open-share-node])');
	[].forEach.call(countNodes, initializeCountNode);

	// trigger completed event
	Events.trigger(document, 'count-loaded');
}

function initializeCountNode(os) {
	// initialize open share object with type attribute
	let type = os.getAttribute('data-open-share-count'),
		url = os.getAttribute('data-open-share-count-repo') ||
			os.getAttribute('data-open-share-count-shot') ||
			os.getAttribute('data-open-share-count-url'),
		count = new Count(type, url);

	count.count(os);
	os.setAttribute('data-open-share-node', type);
}

function initializeWatcher(watcher) {
	[].forEach.call(watcher, (w) => {
		var observer = new MutationObserver((mutations) => {
			// target will match between all mutations so just use first
			initializeNodes(mutations[0].target);
		});

		observer.observe(w, {
			childList: true
		});
	});
}
