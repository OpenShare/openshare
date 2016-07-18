/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
module.exports = {

	// set Twitter share URL
	twitter: function(data, ios = false) {
		// if iOS user and ios data attribute defined
		// build iOS URL scheme as single string
		if (ios && data.ios) {

			let message = ``;

			if (data.text) {
				message += data.text;
			}

			if (data.url) {
				message += ` - ${data.url}`;
			}

			if (data.hashtags) {
				let tags = data.hashtags.split(',');
				tags.forEach(function(tag) {
					message += ` #${tag}`;
				});
			}

			if (data.via) {
				message += ` via ${data.via}`;
			}

			return {
				url: 'twitter://post?',
				data: {
					message: message
				}
			};
		}

		return {
			url: 'https://twitter.com/share?',
			data: data,
			popup: {
				width: 700,
				height: 296
			}
		};
	},

	// set Twitter retweet URL
	twitterRetweet: function(data, ios = false) {
		// if iOS user and ios data attribute defined
		if (ios && data.ios) {
			return {
				url: 'twitter://status?',
				data: {
					id: data.tweetId
				}
			};
		}

		return {
			url: 'https://twitter.com/intent/retweet?',
			data: {
				tweet_id: data.tweetId,
				related: data.related
			},
			popup: {
				width: 700,
				height: 296
			}
		};
	},

	// set Twitter like URL
	twitterLike: function(data, ios = false) {
		// if iOS user and ios data attribute defined
		if (ios && data.ios) {
			return {
				url: 'twitter://status?',
				data: {
					id: data.tweetId
				}
			};
		}

		return {
			url: 'https://twitter.com/intent/favorite?',
			data: {
				tweet_id: data.tweetId,
				related: data.related
			},
			popup: {
				width: 700,
				height: 296
			}
		};
	},

	// set Twitter follow URL
	twitterFollow: function(data, ios = false) {
		// if iOS user and ios data attribute defined
		if (ios && data.ios) {
			let iosData = data.screenName ? {
				'screen_name': data.screenName
			} : {
				'id': data.userId
			};

			return {
				url: 'twitter://user?',
				data: iosData
			};
		}

		return {
			url: 'https://twitter.com/intent/user?',
			data: {
				screen_name: data.screenName,
				user_id: data.userId
			},
			popup: {
				width: 700,
				height: 296
			}
		};
	},

	// set Facebook share URL
	facebook: function(data) {
		return {
			url: 'https://www.facebook.com/dialog/feed?app_id=961342543922322&redirect_uri=http://facebook.com&',
			data: data,
			popup: {
				width: 560,
				height: 593
			}
		};
	},

	// set Facebook send URL
	facebookSend: function(data) {
		return {
			url: 'https://www.facebook.com/dialog/send?app_id=961342543922322&redirect_uri=http://facebook.com&',
			data: data,
			popup: {
				width: 980,
				height: 596
			}
		};
	},

	// set YouTube play URL
	youtube: function(data, ios = false) {
		// if iOS user
		if (ios && data.ios) {
			return {
				url: `youtube:${data.video}?`
			};
		} else {
			return {
				url: `https://www.youtube.com/watch?v=${data.video}?`,
				popup: {
					width: 1086,
					height: 608
				}
			};
		}
	},

	// set YouTube subcribe URL
	youtubeSubscribe: function(data, ios = false) {
		// if iOS user
		if (ios && data.ios) {
			return {
				url: `youtube://www.youtube.com/user/${data.user}?`
			};
		} else {
			return {
				url: `https://www.youtube.com/user/${data.user}?`,
				popup: {
					width: 880,
					height: 350
				}
			};
		}
	},

	// set Instagram follow URL
	instagram: function(data) {
		return {
			url: `instagram://camera?`
		};
	},

	// set Instagram follow URL
	instagramFollow: function(data, ios = false) {
		// if iOS user
		if (ios && data.ios) {
			return {
				url: 'instagram://user?',
				data: data
			};
		} else {
			return {
				url: `http://www.instagram.com/${data.username}?`,
				popup: {
					width: 980,
					height: 655
				}
			};
		}
	},

	// set Snapchat follow URL
	snapchat (data) {
		return {
			url: `snapchat://add/${data.username}?`
		};
	},

	// set Google share URL
	google (data) {
		return {
			url: 'https://plus.google.com/share?',
			data: data,
			popup: {
				width: 495,
				height: 815
			}
		};
	},

	// set Google maps URL
	googleMaps (data, ios = false) {

		if (data.search) {
			data.q = data.search;
			delete data.search;
		}

		// if iOS user and ios data attribute defined
		if (ios && data.ios) {
			return {
				url: 'comgooglemaps://?',
				data: ios
			};
		}

		if (!ios && data.ios) {
			delete data.ios;
		}

		return {
			url: 'https://maps.google.com/?',
			data: data,
			popup: {
				width: 800,
				height: 600
			}
		};
	},

	// set Pinterest share URL
	pinterest (data) {
		return {
			url: 'https://pinterest.com/pin/create/bookmarklet/?',
			data: data,
			popup: {
				width: 745,
				height: 620
			}
		};
	},

	// set LinkedIn share URL
	linkedin (data) {
		return {
			url: 'http://www.linkedin.com/shareArticle?',
			data: data,
			popup: {
				width: 780,
				height: 492
			}
		};
	},

	// set Buffer share URL
	buffer (data) {
		return {
			url: 'http://bufferapp.com/add?',
			data: data,
			popup: {
				width: 745,
				height: 345
			}
		};
	},

	// set Tumblr share URL
	tumblr (data) {
		return {
			url: 'https://www.tumblr.com/widgets/share/tool?',
			data: data,
			popup: {
				width: 540,
				height: 940
			}
		};
	},

	// set Reddit share URL
	reddit (data) {
		return {
			url: 'http://reddit.com/submit?',
			data: data,
			popup: {
				width: 860,
				height: 880
			}
		};
	},

	// set Flickr follow URL
	flickr (data, ios = false) {
		// if iOS user
		if (ios && data.ios) {
			return {
				url: `flickr://photos/${data.username}?`
			};
		} else {
			return {
				url: `http://www.flickr.com/photos/${data.username}?`,
				popup: {
					width: 600,
					height: 650
				}
			};
		}
	},

	// set WhatsApp share URL
	whatsapp (data) {
		return {
			url: 'whatsapp://send?',
			data: data
		};
	},

	// set sms share URL
	sms (data, ios = false) {
		return {
			url: ios ? 'sms:&' : 'sms:?',
			data: data
		};
	},

	// set Email share URL
	email (data) {

		var url = `mailto:`;

		// if to address specified then add to URL
		if (data.to !== null) {
			url += `${data.to}`;
		}

		url += `?`;

		return {
			url: url,
			data: {
				subject: data.subject,
				body: data.body
			}
		};
	},

	// set Github fork URL
	github (data, ios = false) {
		let url = data.repo ?
			`https://github.com/${data.repo}` :
			data.url;

		if (data.issue) {
			url += '/issues/new?title=' +
				data.issue +
				'&body=' +
				data.body;
		}

		return {
			url: url + '?',
			popup: {
				width: 1020,
				height: 323
			}
		};
	},

	// set Dribbble share URL
	dribbble (data, ios = false) {
		const url = data.shot ?
			`https://dribbble.com/shots/${data.shot}?` :
			data.url + '?';
		return {
			url: url,
			popup: {
				width: 440,
				height: 640
			}
		};
	},

	codepen (data) {
		const url = (data.pen && data.username && data.view) ?
			`https://codepen.io/${data.username}/${data.view}/${data.pen}?` :
			data.url + '?';
		return {
			url: url,
			popup: {
				width: 1200,
				height: 800
			}
		};
	},

	paypal (data) {
		return {
			data: data
		};
	}
};
