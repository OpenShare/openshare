/**
 * Global OpenShare API to generate instances programmatically
 */
module.exports = function(OS, Transforms, Events) {

	// global OpenShare referencing internal class for instance generation
	function OpenShare(element, data) {
		this.element = element;
		this.data = data;

		this.os = new OS(data.type, Transforms[data.type]);
		this.os.setData(data);

		// automatically open share dialog on click
		if (this.data.bindClick) {
			this.element.addEventListener('click', (e) => {
				this.share();
			});
		}
	}

	// public share method to trigger share programmatically
	OpenShare.prototype.share = function(e) {
		// if dynamic instance then fetch attributes again in case of updates
		if (this.data.dynamic) {
			this.os.setData(data);
		}

		this.os.share(e);

		Events.trigger(this.element, 'shared');
	};

	return OpenShare;
};
