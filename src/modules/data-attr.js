/**
 * Configure data attribute API
 */

var OpenShare = require('./open-share');
var Count = require('./count');
var ShareTransforms = require('./share-transforms');
var Events = require('./events');

module.exports = function() {

	document.addEventListener('OpenShare.load', init);
	document.addEventListener('DOMContentLoaded', init);

	function init() {
		initializeNodes();

		// check for mutation observers before using, IE11 only
		if (window.MutationObserver !== undefined) {
			initializeWatcher(document.querySelectorAll('[data-open-share-watch]'));
		}
	}

	function initializeNodes(container = document) {
		// loop through open share node collection
		let shareNodes = container.querySelectorAll('[data-open-share]:not([data-open-share-node])');
		[].forEach.call(shareNodes, initializeShareNode);

		// loop through count node collection
		let countNodes = container.querySelectorAll('[data-open-share-count]:not([data-open-share-node])');
		[].forEach.call(countNodes, initializeCountNode);

		// trigger completed event
		Events.trigger(document, 'loaded');
	}

	function initializeCountNode(os) {
		// initialize open share object with type attribute
		let type = os.getAttribute('data-open-share-count'),
			url = os.getAttribute('data-open-share-count-repo') ||
				os.getAttribute('data-open-share-count-shot') ||
				os.getAttribute('data-open-share-count-url'),
			count = new Count(type, url);

		count.count(os);
		os.setAttribute('data-open-share-node', type);
	}

	function initializeShareNode(os) {
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

		let transform = ShareTransforms[type];

		if (!transform) {
			throw new Error(`Open Share: ${type} is an invalid type`);
		}

		openShare = new OpenShare(type, transform);

		// specify if this is a dynamic instance
		if (os.getAttribute('data-open-share-dynamic')) {
			openShare.dynamic = true;
		}

		// set all optional attributes on open share instance
		setData(openShare, os);

		// open share dialog on click
		os.addEventListener('click', (e) => {
			share(e, os, openShare);
		});

		os.addEventListener('OpenShare.trigger', (e) => {
			share(e, os, openShare);
		});

		os.setAttribute('data-open-share-node', type);
	}

	function initializeWatcher(watcher) {
		[].forEach.call(watcher, (w) => {
			var observer = new MutationObserver((mutations) => {
				// target will match between all mutations so just use first
				initializeNodes(mutations[0].target);
			});

			observer.observe(w, {
				childList: true
			});
		});
	}

	function share(e, os, openShare) {
		// if dynamic instance then fetch attributes again in case of updates
		if (openShare.dynamic) {
			setData(openShare, os);
		}

		openShare.share(e);

		// trigger shared event
		Events.trigger(os, 'shared');
	}

	function setData(osInstance, osElement) {
		osInstance.setData({
			url: osElement.getAttribute('data-open-share-url'),
			text: osElement.getAttribute('data-open-share-text'),
			via: osElement.getAttribute('data-open-share-via'),
			hashtags: osElement.getAttribute('data-open-share-hashtags'),
			tweetId: osElement.getAttribute('data-open-share-tweet-id'),
			related: osElement.getAttribute('data-open-share-related'),
			screenName: osElement.getAttribute('data-open-share-screen-name'),
			userId: osElement.getAttribute('data-open-share-user-id'),
			link: osElement.getAttribute('data-open-share-link'),
			picture: osElement.getAttribute('data-open-share-picture'),
			caption: osElement.getAttribute('data-open-share-caption'),
			description: osElement.getAttribute('data-open-share-description'),
			user: osElement.getAttribute('data-open-share-user'),
			video: osElement.getAttribute('data-open-share-video'),
			username: osElement.getAttribute('data-open-share-username'),
			title: osElement.getAttribute('data-open-share-title'),
			media: osElement.getAttribute('data-open-share-media'),
			to: osElement.getAttribute('data-open-share-to'),
			subject: osElement.getAttribute('data-open-share-subject'),
			body: osElement.getAttribute('data-open-share-body'),
			ios: osElement.getAttribute('data-open-share-ios'),
			type: osElement.getAttribute('data-open-share-type'),
			center: osElement.getAttribute('data-open-share-center'),
			views: osElement.getAttribute('data-open-share-views'),
			zoom: osElement.getAttribute('data-open-share-zoom'),
			search: osElement.getAttribute('data-open-share-search'),
			saddr: osElement.getAttribute('data-open-share-saddr'),
			daddr: osElement.getAttribute('data-open-share-daddr'),
			directionsmode: osElement.getAttribute('data-open-share-directions-mode'),
			repo: osElement.getAttribute('data-open-share-repo'),
			shot: osElement.getAttribute('data-open-share-shot'),
			pen: osElement.getAttribute('data-open-share-pen'),
			view: osElement.getAttribute('data-open-share-view')
		});
	}
};
