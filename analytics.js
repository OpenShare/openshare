module.exports = function (type, cb) {
   let count = 10;

   document.addEventListener('DOMContentLoaded', function () {

	   const isGA = type === 'ga' || type === 'ga-social';
	   const isTagManager = type === 'tagManager';

	   if (isGA) checkIfAnalyticsLoaded(type, cb, count);
	   if (isTagManager) setTagManager(cb);
   });
};

function checkIfAnalyticsLoaded(type, cb, count) {
	count--;
	if (window.ga) {
		  if (cb) cb();
		  // bind to shared event on each individual node
		  listen(function (e) {
			const platform = e.target.getAttribute('data-open-share');
			const target = e.target.getAttribute('data-open-share-link') ||
				e.target.getAttribute('data-open-share-url') ||
				e.target.getAttribute('data-open-share-username') ||
			    e.target.getAttribute('data-open-share-center') ||
				e.target.getAttribute('data-open-share-search') ||
				e.target.getAttribute('data-open-share-body');

			if (type === 'ga') {
				ga('send', 'event', {
					eventCategory: 'OpenShare Click',
					eventAction: platform,
					eventLabel: target,
					transport: 'beacon'
				});
			}

			if (type === 'ga-social') {
				ga('send', {
					hitType: 'social',
					socialNetwork: platform,
					socialAction: 'share',
					socialTarget: target
				});
			}
		});

	}
	else {
		  if (count) {
			setTimeout(function () {
			  checkIfAnalyticsLoaded(type, cb, count);
		  	}, 1000);
  		}
	}
}

function setTagManager (cb) {
	if (cb) cb();

	window.dataLayer = window.dataLayer || [];

	listen(onShareTagManger);

	getCounts(function(e) {
		const count = e.target ?
		  e.target.innerHTML :
		  e.innerHTML;

		const platform = e.target ?
		   e.target.getAttribute('data-open-share-count-url') :
		   e.getAttribute('data-open-share-count-url');

		window.dataLayer.push({
			'event' : 'OpenShare Count',
			'platform': platform,
			'resource': count,
			'activity': 'count'
		});
	});
}

function listen (cb) {
	// bind to shared event on each individual node
	[].forEach.call(document.querySelectorAll('[data-open-share]'), function(node) {
		node.addEventListener('OpenShare.shared', cb);
	});
}

function getCounts (cb) {
	var countNode = document.querySelectorAll('[data-open-share-count]');

	[].forEach.call(countNode, function(node) {
		if (node.textContent) cb(node);
		else node.addEventListener('OpenShare.counted-' + node.getAttribute('data-open-share-count-url'), cb);
	});
}

function onShareTagManger (e) {
	const platform = e.target.getAttribute('data-open-share');
	const target = e.target.getAttribute('data-open-share-link') ||
		e.target.getAttribute('data-open-share-url') ||
		e.target.getAttribute('data-open-share-username') ||
		e.target.getAttribute('data-open-share-center') ||
		e.target.getAttribute('data-open-share-search') ||
		e.target.getAttribute('data-open-share-body');

	window.dataLayer.push({
		'event' : 'OpenShare Share',
		'platform': platform,
		'resource': target,
		'activity': 'share'
	});
}
