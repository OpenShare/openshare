/**
 * Global OpenShare API to generate instances programmatically
 */

var OS = require('./open-share');
var ShareTransforms = require('./share-transforms');
var Events = require('./events');

module.exports = function() {

	// global OpenShare referencing internal class for instance generation
	class OpenShare {

		constructor(element, data) {
			let node;
			this.element = element;
			this.data = data;

			this.os = new OS(data.type, ShareTransforms[data.type]);
			this.os.setData(data);

			if (element === null || data.element) {
				element = data.element;
				node = document.createElement(element || 'a');
				if (data.type) {
					node.classList.add('open-share-link', data.type);
					node.setAttribute('data-open-share', data.type);
				}
				if (data.url) node.setAttribute('data-open-share-url', data.url);
				if (data.via) node.setAttribute('data-open-share-via', data.via);
				if (data.text) node.setAttribute('data-open-share-text', data.text);
				if (data.hashtags) node.setAttribute('data-open-share-hashtags', data.hashtags);
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

			if (node) return node;
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
