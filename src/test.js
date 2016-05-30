var OpenShare = {
	share: require('./share.js'),
	count: require('./count.js')
};

var dynamicNodeData = {
	'url': 'http://www.digitalsurgeons.com',
	'via': 'digitalsurgeons',
	'text': 'Forward Obsessed',
	'hashtags': 'forwardobsessed',
	'button': 'Open Share Watcher!'
};

function createOpenShareNode(data) {
	var openShare = document.createElement('a');

	openShare.classList.add('open-share-link', 'twitter');
	openShare.setAttribute('data-open-share', 'twitter');
	openShare.setAttribute('data-open-share-url', data.url);
	openShare.setAttribute('data-open-share-via', data.via);
	openShare.setAttribute('data-open-share-text', data.text);
	openShare.setAttribute('data-open-share-hashtags', data.hashtags);
	openShare.innerHTML = '<span class="fa fa-twitter"></span>' + data.button;

	var node = new OpenShare.share({
		type: 'twitter',
		url: 'http://www.digitalsurgeons.com',
		via: 'digitalsurgeons',
		hashtags: 'forwardobsessed',
		appendTo: document.querySelector('.open-share-watch'),
		innerHTML: 'Created via OpenShareAPI',
		element: 'div',
		classes: ['wow', 'such', 'classes']
	});

	return openShare;
}

function addNode() {
	var data = dynamicNodeData;
	document.querySelector('.open-share-watch')
		.appendChild(createOpenShareNode(data));
}

window.addNode = addNode;

function addNodeWithCount() {
	var data = dynamicNodeData;

	var openShareNode = createOpenShareNode(data);
	document.querySelector('.open-share-watch').appendChild(openShareNode);

	var countNode = new OpenShare.count({
		type: 'facebook',
		url: 'https://www.digitalsurgeons.com/thoughts/strategy/podcast-killed-the-video-star-how-podcast-advertising-builds-authentic-enga'
	});

	openShareNode.appendChild(countNode);
}

window.addNodeWithCount = addNodeWithCount;

function createCountNode() {
 	var container = document.querySelector('.create-node.count-nodes');
	var type = container.querySelector('input.count-type').value;
	var url = container.querySelector('input.count-url').value;

	var count = new OpenShare.count({
		type: type,
		url: url,
		appendTo: document.querySelector('.open-share-watch')
	});

	count.style.position = 'relative';

	container.querySelector('input.count-type').value = '';
	container.querySelector('input.count-url').value = '';
}

window.createCountNode = createCountNode;

// document.addEventListener('DOMContentLoaded', function() {
// 	// add open share node
// 	var data = dynamicNodeData;
// 	data.button = 'Dynamic Open Share!';
// 	document.querySelector('.open-share-nodes')
// 		.appendChild(createOpenShareNode(dynamicNodeData));
//
// 	var ev = document.createEvent('Event');
// 	ev.initEvent('OpenShare.load', true, true);
// 	document.dispatchEvent(ev);
// });

// bind to loaded event
document.addEventListener('OpenShare.share-loaded', function() {
	console.log('Open Share loaded');

	// bind to shared event on each individual node
	[].forEach.call(document.querySelectorAll('[data-open-share]'), function(node) {
		node.addEventListener('OpenShare.shared', function(e) {
			console.log('Open Share Shared', e);
		});
	});

	var examples = {
		twitter: new OpenShare.share({
			type: 'twitter',
			bindClick: true,
			url: 'http://digitalsurgeons.com',
			via: 'digitalsurgeons',
			text: 'Digital Surgeons',
			hashtags: 'forwardobsessed'
		}, document.querySelector('[data-api-example="twitter"]')),

		facebook: new OpenShare.share({
			type: 'facebook',
			bindClick: true,
			link: 'http://digitalsurgeons.com',
			picture: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
			caption: 'Digital Surgeons',
			description: 'forwardobsessed'
		}, document.querySelector('[data-api-example="facebook"]')),

		pinterest: new OpenShare.share({
			type: 'pinterest',
			bindClick: true,
			url: 'http://digitalsurgeons.com',
			media: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
			description: 'Digital Surgeons',
			appendTo: document.body
		}, document.querySelector('[data-api-example="pinterest"]')),

		email: new OpenShare.share({
			type: 'email',
			bindClick: true,
			to: 'techroom@digitalsurgeons.com',
			subject: 'Digital Surgeons',
			body: 'Forward Obsessed'
		}, document.querySelector('[data-api-example="email"]'))
	};
});

// Example of listening for counted events on individual urls or arrays of urls
var urls = [
	'facebook',
	'google',
	'linkedin',
	'reddit',
	'pinterest',
	[
		'google',
		'linkedin',
		'reddit',
		'pinterest'
	]
];

urls.forEach(function(url) {
	if (Array.isArray(url)) {
		url = url.join(',');
	}
	var countNode = document.querySelectorAll('[data-open-share-count="' + url + '"]');

	[].forEach.call(countNode, function(node) {
		node.addEventListener('OpenShare.counted-' + url, function() {
			var counts = node.innerHTML;
			if (counts) console.log(url, 'shares: ', counts);
		});
	});
});


// urls.forEach(function(url) {
// 	if (Array.isArray(url)) {
// 		url = url.join(',');
// 	}
// 	var countNodes = document.querySelectorAll('[data-open-share-count="' + url + '"]');
//
// 	document.addEventListener('OpenShare.counted-' + url, function() {
// 		countNodes.forEach(function(node) {
// 			var counts = node.innerHTML;
// 			console.log(url, 'shares: ', counts);
// 		});
// 	});
// });
