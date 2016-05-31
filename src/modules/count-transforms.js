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
				this.storeSet(this.type + '-' + this.shared, count);
				return count;
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
				this.storeSet(this.type + '-' + this.shared, count);
				return count;
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
				this.storeSet(this.type + '-' + this.shared, count);
				return count;
			}
		};
	},

	// reddit count data
	reddit (url) {
		return {
			type: 'get',
			url: `//www.reddit.com/api/info.json?url=${url}`,
			transform: function(xhr) {
				let posts = JSON.parse(xhr.responseText).data.children,
					ups = 0;

				posts.forEach((post) => {
					ups += Number(post.data.ups);
				});

				this.storeSet(this.type + '-' + this.shared, ups);

				return ups;
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
				this.storeSet(this.type + '-' + this.shared, count);
				return count;
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
				this.storeSet(this.type + '-' + this.shared, count);
				return count;
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
				this.storeSet(this.type + '-' + this.shared, count);
				return count;
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
				this.storeSet(this.type + '-' + this.shared, count);
				return count;
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
						this.storeSet(this.type + '-' + this.shared, finalCount);
						countReduce(this.os, finalCount);
						Events.trigger(this.os, 'counted-' + this.url);
						return finalCount;
					});
				} else {
					this.storeSet(this.type + '-' + this.shared, count);
					return count;
				}
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

function round(x, precision) {
	if (typeof x !== 'number') {
		throw new TypeError('Expected value to be a number');
	}

	var exponent = precision > 0 ? 'e' : 'e-';
	var exponentNeg = precision > 0 ? 'e-' : 'e';
	precision = Math.abs(precision);

	return Number(Math.round(x + exponent + precision) + exponentNeg + precision);
}

function thousandify (num) {
	return round(num/1000, 1) + 'K';
}

function millionify (num) {
	return round(num/1000000, 1) + 'M';
}

function countReduce (el, count) {
	if (count > 999999)  {
		el.innerHTML = millionify(count);
	} else if (count > 999) {
		el.innerHTML = thousandify(count);
	} else {
		el.innerHTML = count;
	}
}
