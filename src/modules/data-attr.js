module.exports = function() {
	document.addEventListener('DOMContentLoaded', require('../../lib/init')({
		selector: {
			share: '[data-open-share]:not([data-open-share-node])',
			count: '[data-open-share-count]:not([data-open-share-node])'
		},
		cb: {
			share: require('../../lib/initializeShareNode'),
			count: require('../../lib/initializeCountNode')
		}
	}));
};
