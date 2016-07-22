const countReduce = require('../../lib/countReduce');
const storeCount = require('../../lib/storeCount');

/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
module.exports = {

	// facebook count data
	facebook (url) {
		return {
			type: 'get',
			url: `//graph.facebook.com/?id=${url}`,
			transform: function(xhr) {
				let count = JSON.parse(xhr.responseText).shares;
				return storeCount(this, count);
			}
		};
	},

	// pinterest count data
	pinterest (url) {
		return {
			type: 'jsonp',
			url: `//api.pinterest.com/v1/urls/count.json?callback=?&url=${url}`,
			transform: function(data) {
				let count = data.count;
				return storeCount(this, count);
			}
		};
	},

	// linkedin count data
	linkedin (url) {
		return {
			type: 'jsonp',
			url: `//www.linkedin.com/countserv/count/share?url=${url}&format=jsonp&callback=?`,
			transform: function(data) {
				let count = data.count;
				return storeCount(this, count);
			}
		};
	},

	// reddit count data
	reddit (url) {
		return {
			type: 'get',
			url: `https://www.reddit.com/api/info.json?url=${url}`,
			transform: function(xhr) {
				let posts = JSON.parse(xhr.responseText).data.children,
					ups = 0;

				posts.forEach((post) => {
					ups += Number(post.data.ups);
				});

				return storeCount(this, ups);
			}
		};
	},

	// google count data
	google (url) {
		return {
			type: 'post',
			data: {
				method: 'pos.plusones.get',
				id: 'p',
				params: {
					nolog: true,
					id: url,
					source: 'widget',
					userId: '@viewer',
					groupId: '@self'
				},
				jsonrpc: '2.0',
				key: 'p',
				apiVersion: 'v1'
			},
			url: `https://clients6.google.com/rpc`,
			transform: function(xhr) {
				let count = JSON.parse(xhr.responseText).result.metadata.globalCounts.count;
				return storeCount(this, count);
			}
		};
	},

	// github star count
	githubStars (repo) {
		repo = repo.indexOf('github.com/') > -1 ?
			repo.split('github.com/')[1] :
			repo;
		return {
			type: 'get',
			url: `//api.github.com/repos/${repo}`,
			transform: function(xhr) {
				let count = JSON.parse(xhr.responseText).stargazers_count;
				return storeCount(this, count);
			}
		};
	},

	// github forks count
	githubForks (repo) {
		repo = repo.indexOf('github.com/') > -1 ?
			repo.split('github.com/')[1] :
			repo;
		return {
			type: 'get',
			url: `//api.github.com/repos/${repo}`,
			transform: function(xhr) {
				let count = JSON.parse(xhr.responseText).forks_count;
				return storeCount(this, count);
			}
		};
	},

	// github watchers count
	githubWatchers (repo) {
		repo = repo.indexOf('github.com/') > -1 ?
			repo.split('github.com/')[1] :
			repo;
		return {
			type: 'get',
			url: `//api.github.com/repos/${repo}`,
			transform: function(xhr) {
				let count = JSON.parse(xhr.responseText).watchers_count;
				return storeCount(this, count);
			}
		};
	},

	// dribbble likes count
	dribbble (shot) {
		shot = shot.indexOf('dribbble.com/shots') > -1 ?
			shot.split('shots/')[1] :
			shot;
		const url = `https://api.dribbble.com/v1/shots/${shot}/likes`;
		return {
			type: 'get',
			url: url,
			transform: function(xhr, Events) {
				let count = JSON.parse(xhr.responseText).length;

				// at this time dribbble limits a response of 12 likes per page
				if (count === 12) {
					let page = 2;
					recursiveCount(url, page, count, finalCount => {
						if (this.appendTo && typeof this.appendTo !== 'function') {
							this.appendTo.appendChild(this.os);
						}
						countReduce(this.os, finalCount, this.cb);
						Events.trigger(this.os, 'counted-' + this.url);
						return storeCount(this, finalCount);
					});
				} else {
					return storeCount(this, count);
				}
			}
		};
	},

	twitter (url) {
		return {
			type: 'get',
			url: `https://api.openshare.social/job?url=${url}`,
			transform: function(xhr) {
				let count = JSON.parse(xhr.responseText).count;
				return storeCount(this, count);
			}
		};
	}
};

function recursiveCount (url, page, count, cb) {
	const xhr = new XMLHttpRequest();
	xhr.open('GET', url + '?page=' + page);
	xhr.addEventListener('load', function () {
		const likes = JSON.parse(this.response);
		count += likes.length;

		// dribbble like per page is 12
		if (likes.length === 12) {
			page++;
			recursiveCount(url, page, count, cb);
		}
		else {
			cb(count);
		}
	});
	xhr.send();
}
