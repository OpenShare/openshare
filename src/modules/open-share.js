/**
 * OpenShare generates a single share link
 */
module.exports = class OpenShare {

	constructor(type, transform) {
		this.ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		this.android = /android/.test(navigator.userAgent) && !window.MSStream;
		this.type = type;
		this.dynamic = false;
		this.transform = transform;

		// capitalized type
		this.typeCaps = type.charAt(0).toUpperCase() + type.slice(1);
	}

	// returns function named as type set in constructor
	// e.g twitter()
	setData(data) {
		// if iOS user and ios data attribute defined
		// build iOS URL scheme as single string
		if (this.ios || this.android) {
			let transform = this.transform(data, {
				ios: this.ios,
				android: this.android
			});

			this.mobileShareUrl = this.template(transform.url, transform.data);
		}

		let transform = this.transform(data);
		this.shareUrl = this.template(transform.url, transform.data);
	}

	// open share URL defined in individual platform functions
	share(e) {
		// if iOS share URL has been set then use timeout hack
		// test for native app and fall back to web
		if (this.mobileShareUrl) {

			window.location = this.mobileShareUrl;
			var start = (new Date()).valueOf();

			setTimeout(() => {
				var end = (new Date()).valueOf();

				// if the user is still here, fall back to web
				if (end - start > 1500) {
					return;
				}

				window.open(this.shareUrl, 'OpenShare');
			}, 1500);

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
