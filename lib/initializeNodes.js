const Events = require('../src/modules/events');
const analytics = require('../analytics');


module.exports = initializeNodes;

function initializeNodes(opts) {
	// loop through open share node collection
	return () => {
		// check for analytics
		checkAnalytics();

		if (opts.api) {
			let nodes = opts.container.querySelectorAll(opts.selector);
			[].forEach.call(nodes, opts.cb);

			// trigger completed event
			Events.trigger(document, opts.api + '-loaded');
		} else {
			// loop through open share node collection
			let shareNodes = opts.container.querySelectorAll(opts.selector.share);
			[].forEach.call(shareNodes, opts.cb.share);

			// trigger completed event
			Events.trigger(document, 'share-loaded');

			// loop through count node collection
			let countNodes = opts.container.querySelectorAll(opts.selector.count);
			[].forEach.call(countNodes, opts.cb.count);

			// trigger completed event
			Events.trigger(document, 'count-loaded');
		}
	};
}

function checkAnalytics () {
	// check for analytics
	if (document.querySelector('[data-open-share-analytics]')) {
		const provider = document.querySelector('[data-open-share-analytics]')
			.getAttribute('data-open-share-analytics');

		if (provider.indexOf(',') > -1) {
			const providers = provider.split(',');
			providers.forEach(p => analytics(p));
		} else analytics(provider);

	}
}
