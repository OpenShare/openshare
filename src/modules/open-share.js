/**
 * OpenShare generates a single share link
 */
module.exports = class OpenShare {

	constructor(type, transform) {
		this.ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		this.type = type;
		this.transform = transform.bind(this);
		this.dynamic = false;

		// capitalized type
		this.typeCaps = type.charAt(0).toUpperCase() + type.slice(1);
	}

	// returns function named as type set in constructor
	// e.g twitter()
	setData(data) {
		return this.transform(data);
	}

	// open share URL defined in individual platform functions
	share(e) {
		// if iOS share URL has been set then use timeout hack
		// test for native app and fall back to web
		if (this.iosShareUrl) {

			window.location = this.iosShareUrl;
			var start = (new Date()).valueOf();

			setTimeout(() => {
				var end = (new Date()).valueOf();

				// if the user is still here, fall back to web
				if (end - start > 3000) {
					return;
				}

				window.open(this.shareUrl, 'OpenShare');
			}, 2000);

			// open mailto links in same window
		} else if (this.type === 'email') {
			window.location = this.shareUrl;

			// open social share URLs in new window
		} else {
			window.open(this.shareUrl, 'OpenShare');
		}
	}

	// create share URL with GET params
	// appending valid properties to query string
	template(url, data) {
		let shareUrl = url,
			i;

		for (i in data) {
			// only append valid properties
			if (!data[i]) {
				continue;
			}

			// append URL encoded GET param to share URL
			data[i] = encodeURIComponent(data[i]);
			shareUrl += `${i}=${data[i]}&`;
		}

		return shareUrl.substr(0, shareUrl.length - 1);
	}
};
