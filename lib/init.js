const initializeNodes = require('./initializeNodes');
const initializeWatcher = require('./initializeWatcher');

module.exports = init;

function init(opts) {
	return () => {
		const initNodes = initializeNodes({
			container: opts.container || document,
			selector: opts.selector,
			cb: opts.cb
		});

		initNodes();

		// check for mutation observers before using, IE11 only
		if (window.MutationObserver !== undefined) {
			initializeWatcher(document.querySelectorAll('[data-open-share-watch]'), initNodes);
		}
	};
}
