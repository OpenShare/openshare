(function() {

	var OpenShare = require('./index');

	var dynamicNodeData = {
		'url': 'http://www.digitalsurgeons.com',
		'via': 'digitalsurgeons',
		'text': 'Forward Obsessed',
		'hashtags': 'forwardobsessed'
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

		return openShare;
	}

	function addNode() {
		var data = dynamicNodeData;
		data.button = 'Open Share Watcher!';
		document.querySelector('.open-share-watch')
			.appendChild(createOpenShareNode(data));
	}

	window.addNode = addNode

	document.addEventListener('DOMContentLoaded', function() {
		// add open share node
		var data = dynamicNodeData;
		data.button = 'Dynamic Open Share!';
		document.querySelector('.open-share-nodes')
			.appendChild(createOpenShareNode(dynamicNodeData));

		var ev = document.createEvent('Event');
		ev.initEvent('OpenShare.load', true, true);
		document.dispatchEvent(ev);
	});

	// bind to loaded event
	document.addEventListener('OpenShare.loaded', function() {
		console.log('Open Share loaded');

		// bind to shared event on each individual node
		[].forEach.call(document.querySelectorAll('[data-open-share]'), function(node) {
			node.addEventListener('OpenShare.shared', function(e) {
				console.log('Open Share Shared', e);
			});
		});

		var examples = {
			twitter: new OpenShare(document.querySelector('[data-api-example="twitter"]'), {
				type: 'twitter',
				bindClick: true,
				url: 'http://digitalsurgeons.com',
				via: 'digitalsurgeons',
				text: 'Digital Surgeons',
				hashtags: 'forwardobsessed'
			}),

			facebook: new OpenShare(document.querySelector('[data-api-example="facebook"]'), {
				type: 'facebook',
				bindClick: true,
				link: 'http://digitalsurgeons.com',
				picture: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
				caption: 'Digital Surgeons',
				description: 'forwardobsessed'
			}),

			pinterest: new OpenShare(document.querySelector('[data-api-example="pinterest"]'), {
				type: 'pinterest',
				bindClick: true,
				url: 'http://digitalsurgeons.com',
				media: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
				description: 'Digital Surgeons'
			}),

			email: new OpenShare(document.querySelector('[data-api-example="email"]'), {
				type: 'email',
				bindClick: true,
				to: 'techroom@digitalsurgeons.com',
				subject: 'Digital Surgeons',
				body: 'Forward Obsessed'
			})
		};
	});
})();
