const Count = require('../src/modules/count');

module.exports = initializeCountNode;

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
