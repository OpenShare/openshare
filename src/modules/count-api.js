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
			classes}, cb) {
			var countNode = document.createElement(element || 'span');

			countNode.setAttribute('data-open-share-count', type);
			countNode.setAttribute('data-open-share-count-url', url);

			countNode.classList.add('open-share-count');

			if (classes && Array.isArray(classes)) {
				classes.forEach(cssCLass => {
					countNode.classList.add(cssCLass);
				});
			}

			if (appendTo) {
				return new count(type, url).count(countNode, appendTo, cb);
			}

			return new count(type, url).count(countNode, cb);
		}
	}

	return Count;
};
