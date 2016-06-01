const Events = require('../src/modules/events');

module.exports = initializeNodes;

function initializeNodes(opts) {
	// loop through open share node collection
	return () => {
		let shareNodes = opts.container.querySelectorAll(opts.selector);
		[].forEach.call(shareNodes, opts.cb);

		// trigger completed event
		Events.trigger(document, 'share-loaded');
	};
}
