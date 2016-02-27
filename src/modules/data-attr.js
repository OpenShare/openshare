/**
 * Configure data attribute API
 */
module.exports = class DataAttr {

	constructor(OpenShare, Transforms, Count) {
		this.OpenShare = OpenShare;
		this.Transforms = Transforms;
		this.Count = Count;

		document.addEventListener('OpenShare.load', this.init.bind(this));
		document.addEventListener('DOMContentLoaded', this.init.bind(this));
	}

	init() {
		this.initializeNodes();

		// check for mutation observers before using, IE11 only
		if (window.MutationObserver !== undefined) {
			this.initializeWatcher(document.querySelectorAll('[data-open-share-watch]'));
		}
	}

	initializeNodes(container = document) {
		// loop through open share node collection
		let shareNodes = container.querySelectorAll('[data-open-share]:not([data-open-share-node])');
		[].forEach.call(shareNodes, this.initializeShareNode.bind(this));

		// loop through count node collection
		let countNodes = container.querySelectorAll('[data-open-share-count]:not([data-open-share-node])');
		[].forEach.call(countNodes, this.initializeCountNode.bind(this));

		// trigger completed event
		let loadedEvent = document.createEvent('Event');
		loadedEvent.initEvent('OpenShare.loaded', true, true);
		document.dispatchEvent(loadedEvent);
	}

	initializeCountNode(os) {
		// initialize open share object with type attribute
		let type = os.getAttribute('data-open-share-count'),
			count = new this.Count(type, os.getAttribute('data-open-share-count-url'));

		count.count(os);
		os.setAttribute('data-open-share-node', type);
	}

	initializeShareNode(os) {
		// initialize open share object with type attribute
		let type = os.getAttribute('data-open-share'),
			dash = type.indexOf('-'),
			openShare;

		// type contains a dash
		// transform to camelcase for function reference
		// TODO: only supports single dash, should should support multiple
		if (dash > -1) {
			let nextChar = type.substr(dash + 1, 1),
				group = type.substr(dash, 2);

			type = type.replace(group, nextChar.toUpperCase());
		}

		let transform = this.Transforms[type];

		if (!transform) {
			throw new Error(`Open Share: ${type} is an invalid type`);
		}

		openShare = new this.OpenShare(type, transform);

		// specify if this is a dynamic instance
		if (os.getAttribute('data-open-share-dynamic')) {
			openShare.dynamic = true;
		}

		// set all optional attributes on open share instance
		this.setData(openShare, os);

		// open share dialog on click
		os.addEventListener('click', (e) => {

			// if dynamic instance then fetch attributes again in case of updates
			if (openShare.dynamic) {
				this.setData(openShare, os);
			}

			openShare.share(e);

			// trigger shared event
			let sharedEvent = document.createEvent('Event');
			sharedEvent.initEvent('OpenShare.shared', true, true);
			os.dispatchEvent(sharedEvent);
		});

		os.setAttribute('data-open-share-node', type);
	}

	initializeWatcher(watcher) {
		[].forEach.call(watcher, (w) => {
			var observer = new MutationObserver((mutations) => {
				// target will match between all mutations so just use first
				this.initializeNodes(mutations[0].target);
			});

			observer.observe(w, {
				childList: true
			});
		});
	}

	setData(osInstance, osElement) {
		osInstance.setData({
			url: osElement.getAttribute('data-open-share-url'),
			text: osElement.getAttribute('data-open-share-text'),
			via: osElement.getAttribute('data-open-share-via'),
			hashtags: osElement.getAttribute('data-open-share-hashtags'),
			ios: osElement.getAttribute('data-open-share-ios'),
			tweetId: osElement.getAttribute('data-open-share-tweet-id'),
			related: osElement.getAttribute('data-open-share-related'),
			screenName: osElement.getAttribute('data-open-share-screen-name'),
			userId: osElement.getAttribute('data-open-share-user-id'),
			link: osElement.getAttribute('data-open-share-link'),
			picture: osElement.getAttribute('data-open-share-picture'),
			caption: osElement.getAttribute('data-open-share-caption'),
			description: osElement.getAttribute('data-open-share-description'),
			title: osElement.getAttribute('data-open-share-title'),
			media: osElement.getAttribute('data-open-share-media'),
			to: osElement.getAttribute('data-open-share-to'),
			subject: osElement.getAttribute('data-open-share-subject'),
			body: osElement.getAttribute('data-open-share-body')
		});
	}
};
