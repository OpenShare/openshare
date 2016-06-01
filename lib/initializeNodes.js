const Events = require('../src/modules/events');

module.exports = initializeNodes;

function initializeNodes(opts) {
	// loop through open share node collection
	return () => {
		let nodes = opts.container.querySelectorAll(opts.selector);
		[].forEach.call(nodes, opts.cb);

		// trigger completed event
		Events.trigger(document, opts.api + '-loaded');
	};
}
