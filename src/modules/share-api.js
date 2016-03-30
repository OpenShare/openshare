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
			this.element = element;
			this.data = data;

			this.os = new OS(data.type, ShareTransforms[data.type]);
			this.os.setData(data);

			// automatically open share dialog on click
			if (this.data.bindClick) {
				this.element.addEventListener('click', (e) => {
					this.share();
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
