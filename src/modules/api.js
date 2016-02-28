module.exports = function(OS, Transforms, Events) {

	function OpenShare(element, data) {
		this.element = element;
		this.data = data;

		this.os = new OS(data.type, Transforms[data.type]);
		this.os.setData(data);

		// open share dialog on click
		if (this.data.bindClick) {
			this.element.addEventListener('click', (e) => {
				this.share();
			});
		}
	}

	OpenShare.prototype.share = function(e) {
		// if dynamic instance then fetch attributes again in case of updates
		if (this.data.dynamic) {
			this.os.setData(data);
		}

		this.os.share(e);

		Events.trigger(this.element, 'shared');
	};

	window.OpenShare = OpenShare;
};
