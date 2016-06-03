/**
 * Global OpenShare API to generate instances programmatically
 */

const OS = require('./open-share');
const ShareTransforms = require('./share-transforms');
const Events = require('./events');
const dashToCamel = require('../../lib/dashToCamel');

module.exports = function() {

	// global OpenShare referencing internal class for instance generation
	class OpenShare {

		constructor(data, element) {

			if (!data.bindClick) data.bindClick = true;

			let dash = data.type.indexOf('-');

			if (dash > -1) {
				data.type = dashToCamel(dash, data.type);
			}

			let node;
			this.element = element;
			this.data = data;

			this.os = new OS(data.type, ShareTransforms[data.type]);
			this.os.setData(data);

			if (!element || data.element) {
				element = data.element;
				node = document.createElement(element || 'a');
				if (data.type) {
					node.classList.add('open-share-link', data.type);
					node.setAttribute('data-open-share', data.type);
					node.setAttribute('data-open-share-node', data.type);
				}
				if (data.innerHTML) node.innerHTML = data.innerHTML;
			}
			if (node) element = node;

			if (data.bindClick) {
				element.addEventListener('click', (e) => {
					this.share();
				});
			}

			if (data.appendTo) {
				data.appendTo.appendChild(element);
			}

			if (data.classes && Array.isArray(data.classes)) {
				data.classes.forEach(cssClass => {
					element.classList.add(cssClass);
				});
			}

			this.element = element;
			return element;
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
