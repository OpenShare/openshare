const ShareTransforms = require('../src/modules/share-transforms');
const OpenShare = require('../src/modules/open-share');
const setData = require('./setData');
const share = require('./share');

module.exports = initializeShareNode;

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
