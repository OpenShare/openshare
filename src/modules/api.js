module.exports = function(OS, Transforms, Events) {

	function OpenShare(element, data) {
		var os = new OS(data.type, Transforms[data.type]);
		os.setData(data);

		// open share dialog on click
		element.addEventListener('click', (e) => {

			// if dynamic instance then fetch attributes again in case of updates
			if (data.dynamic) {
				os.setData(data);
			}

			os.share(e);

			Events.trigger(element, 'shared');
		});
	}

	window.OpenShare = OpenShare;
};
