/**
 * count API
 */

var count = require('./count');

module.exports = function() {

	// global OpenShare referencing internal class for instance generation
	class Count {

		constructor({
			type,
			url,
			appendTo,
			element,
			classes}) {
			var countNode = document.createElement(element || 'span');

			countNode.setAttribute('data-open-share-count', type);
			countNode.setAttribute('data-open-share-count-url', url);

			countNode.classList.add('open-share-count');

			if (classes && Array.isArray(classes)) {
				classes.forEach(cssCLass => {
					countNode.classList.add(cssCLass);
				});
			}
		}

		// public share method to trigger share programmatically
		share(e) {
			// if dynamic instance then fetch attributes again in case of updates
			if (this.data.dynamic) {
				this.os.setData(data);
			}

			this.os.share(e);

			Events.trigger(this.element, 'shared');
		}
	}

	return OpenShare;
};
