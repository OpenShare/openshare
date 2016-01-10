/**
 * OpenShare generates a single share link
 */
module.exports = class Count {

	constructor(type, url) {

		// throw error if no url provided
		if (!url) {
			throw new Error(`Open Share: no url provided for count`);
		}

		// if type is comma separate list create array
		if (type.includes(',')) {
			this.typeArr = type.split(',');
			this.countData = [];

			// check each type supplied is valid
			this.typeArr.forEach((t) => {
				if (!this[t]) {
					throw new Error(`Open Share: ${type} is an invalid count type`);
				}

				this.countData.push(this[t](url));
			});

		// throw error if invalid type provided
		} else if (!this[type]) {
			throw new Error(`Open Share: ${type} is an invalid count type`);

		// single count
		// store count URL and transform function
		} else {
			this.type = type;
			this.countData = this[type](url);
		}
	}

	// handle calling getCount / getCounts
	// depending on number of types
	count(os) {
		this.os = os;

		if (!Array.isArray(this.countData)) {
			this.getCount();
		} else {
			this.getCounts();
		}
	}

	// fetch count either AJAX or JSONP
	getCount() {
		var count = this.storeGet(this.type);

		if (count) {
			this.os.innerHTML = count;
		}

		this[this.countData.type](this.countData);
	}

	// fetch multiple counts and aggregate
	getCounts() {
		console.log('Aggregate multiple counts now');

		this.total = [];

		this.countData.forEach((countData) => {
			var count = this.storeGet(this.type);

			if (count) {
				this.os.innerHTML = count;
			}

			this[countData.type](countData, (num) => {
				this.total.push(num);

				// total counts length now equals type array length\
				// so aggregate, store and insert into DOM
				if (this.total.length === this.typeArr.length) {
					let tot = 0;

					this.total.forEach((t) => {
						tot += t;
					});

					this.storeSet(this.type, tot);
					this.os.innerHTML = tot;
				}
			});
		});

		this.os.innerHTML = total;
	}

	// handle JSONP requests
	jsonp(countData) {
		// define random callback and assign transform function
		let callback = `jsonp_${Math.random().toString().substr(-10)}`;
		window[callback] = (data) => {
			let count = countData.transform(data);
			this.os.innerHTML = count;
		};

		// append JSONP script tag to page
		let script = document.createElement('script');
		script.src = countData.url.replace('callback=?', `callback=${callback}`);
		document.getElementsByTagName('head')[0].appendChild(script);

		return;
	}

	// handle AJAX GET request
	get(countData) {
		let xhr = new XMLHttpRequest();

		// on success pass response to transform function
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== XMLHttpRequest.DONE ||
				xhr.status !== 200) {
				return;
			}

			let count = countData.transform(xhr);

			if (count) {
				this.os.innerHTML = count;
			}
		};

		xhr.open('GET', countData.url);
		xhr.send();
	}

	// handle AJAX POST request
	post(countData) {
		let xhr = new XMLHttpRequest();

		// on success pass response to transform function
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== XMLHttpRequest.DONE ||
				xhr.status !== 200) {
				return;
			}

			let count = countData.transform(xhr);

			if (count) {
				this.os.innerHTML = count;
			}
		};

		xhr.open('POST', countData.url);
		xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
		xhr.send(JSON.stringify(countData.data));
	}

	storeSet(type, count = 0) {
		if (!window.localStorage || !type) {
			return;
		}

		localStorage.setItem(`OpenShare-${type}`, count);
	}

	storeGet(type) {
		if (!window.localStorage || !type) {
			return;
		}

		return localStorage.getItem(`OpenShare-${type}`);
	}

	// facebook count data
	facebook(url) {
		return {
			type: 'get',
			url: `http://graph.facebook.com/?id=${url}`,
			transform: (xhr) => {
				let count = JSON.parse(xhr.responseText).shares;
				this.storeSet(this.type, count);
				return count;
			}
		};
	}

	// pinterest count data
	pinterest(url) {
		return {
			type: 'jsonp',
			url: `http://api.pinterest.com/v1/urls/count.json?callback=?&url=${url}`,
			transform: (data) => {
				let count = data.count;
				this.storeSet(this.type, count);
				return count;
			}
		};
	}

	// linkedin count data
	linkedin(url) {
		return {
			type: 'jsonp',
			url: `http://www.linkedin.com/countserv/count/share?url=${url}&format=jsonp&callback=?`,
			transform: (data) => {
				let count = data.count;
				this.storeSet(this.type, count);
				return count;
			}
		};
	}

	// reddit count data
	reddit(url) {
		return {
			type: 'get',
			url: `https://www.reddit.com/api/info.json?url=${url}`,
			transform: (xhr) => {
				let posts = JSON.parse(xhr.responseText).data.children,
					ups = 0;

				posts.forEach((post) => {
					ups += Number(post.data.ups);
				});

				this.storeSet(this.type, ups);

				return ups;
			}
		};
	}

	// linkedin count data
	google(url) {
		return {
			type: 'post',
			data: {
				method: 'pos.plusones.get',
				id: 'p',
				params: {
					nolog: true,
					id: url,
					source: 'widget',
					userId: '@viewer',
					groupId: '@self'
				},
				jsonrpc: '2.0',
				key: 'p',
				apiVersion: 'v1'
			},
			url: `https://clients6.google.com/rpc`,
			transform: (xhr) => {
				let count = JSON.parse(xhr.responseText).result.metadata.globalCounts.count;
				this.storeSet(this.type, count);
				return count;
			}
		};
	}

};
