module.exports = function (type, cb) {
   document.addEventListener('DOMContentLoaded', function () {
       // TODO: check for type and cb, throw errors if missing.

	   const isGA = type === 'ga' || type === 'ga-social';
	   const isTagManager = type === 'tagManager';

	   if (isGA) checkIfAnalyticsLoaded(type, cb);
	   if (isTagManager) setTagManager(cb);
   });
};

function checkIfAnalyticsLoaded(type, cb) {
  if (window._gaq && window._gaq._getTracker) {
	  if (cb) cb();
	  // bind to shared event on each individual node
	  listen(function (e) {
		const platform = e.target.getAttribute('data-open-share');
		const target = e.target.getAttribute('data-open-share-link');

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
				socialAction: 'like', //share, like, plus, follow, pin(?)
				socialTarget: target //resource shared
			});
		}
  	});
  }
  else setTimeout(500, checkIfAnalyticsLoaded(cb));
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
	const target = e.target.getAttribute('data-open-share-link');

	window.dataLayer.push({
		'event' : 'OpenShare Share',
		'platform': platform,
		'resource': 'http://some.content/to/be/shared',
		'activity': 'share'
	});
}
