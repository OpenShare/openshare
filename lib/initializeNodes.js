const Events = require('../src/modules/events');

module.exports = initializeNodes;

function initializeNodes(opts) {
	// loop through open share node collection
	return () => {
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
