module.exports = function (type, cb) {
   let count = 10;

   document.addEventListener('DOMContentLoaded', function () {
       // TODO: check for type and cb, throw errors if missing.

	   const isGA = type === 'ga' || type === 'ga-social';
	   const isTagManager = type === 'tagManager';

	   if (isGA) checkIfAnalyticsLoaded(type, cb, count);
	   if (isTagManager) setTagManager(cb);
   });
};

function checkIfAnalyticsLoaded(type, cb, count) {
	count--;
	console.log('count:', count);
	if (window._gaq && window._gaq._getTracker) {
		  console.log('ga found', cb);
		  if (cb) cb();
		  // bind to shared event on each individual node
		  listen(function (e) {
			const platform = e.target.getAttribute('data-open-share');
			const target = e.target.getAttribute('data-open-share-link') || e.target.getAttribute('data-open-share-url');

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
	  console.log('no ga, re-run');
	  if (count) setTimeout(checkIfAnalyticsLoaded(type, cb, count), 5000);
	}
}

function setTagManager (cb) {
	if (cb) cb();

	window.dataLayer = window.dataLayer || [];

	listen(onShareTagManger);
}

function listen (cb) {
	// bind to shared event on each individual node
	[].forEach.call(document.querySelectorAll('[data-open-share]'), function(node) {
		node.addEventListener('OpenShare.shared', cb);
	});
}

function onShareTagManger (e) {
	const platform = e.target.getAttribute('data-open-share');
	const target = e.target.getAttribute('data-open-share-link') || e.target.getAttribute('data-open-share-url');

	window.dataLayer.push({
		'event' : 'OpenShare Share',
		'platform': platform,
		'resource': target,
		'activity': 'share'
	});
}
