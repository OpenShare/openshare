/**
 * Configure data attribute API
 */

const OpenShare = require('./open-share');
const Count = require('./count');
const ShareTransforms = require('./share-transforms');
const Events = require('./events');

const setData = require('../../lib/setData');
const share = require('../../lib/share');
const initializeWatcher = require('../../lib/initializeWatcher');
const initializeShareNode = require('../../lib/initializeShareNode');

module.exports = function() {

	document.addEventListener('OpenShare.load', init);
	document.addEventListener('DOMContentLoaded', init);

	function init() {
		initializeNodes();

		// check for mutation observers before using, IE11 only
		if (window.MutationObserver !== undefined) {
			initializeWatcher(document.querySelectorAll('[data-open-share-watch]'), initializeNodes);
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
};
