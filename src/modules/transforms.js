/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 */
module.exports = {

	// set Twitter share URL
	twitter: function(data, ios = false) {
		// if iOS user and ios data attribute defined
		// build iOS URL scheme as single string
		if (ios) {

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

			return message;

		} else {
			return data;
		}
	},

	// set Twitter retweet URL
	twitterRetweet: function(data) {
		// if iOS user and ios data attribute defined
		if (this.ios && data.ios) {
			this.iosShareUrl = this.template('twitter://status?', {
				id: data.tweetId
			});
		}

		this.shareUrl = this.template('https://twitter.com/intent/retweet?', {
			tweet_id: data.tweetId,
			related: data.related
		});
	},

	// set Twitter like URL
	twitterLike: function(data) {
		// if iOS user and ios data attribute defined
		if (this.ios && data.ios) {
			this.iosShareUrl = this.template('twitter://status?', {
				id: data.tweetId
			});
		}

		this.shareUrl = this.template('https://twitter.com/intent/favorite?', {
			tweet_id: data.tweetId,
			related: data.related
		});
	},

	// set Twitter follow URL
	twitterFollow: function(data) {
		// if iOS user and ios data attribute defined
		if (this.ios && data.ios) {
			let iosData = data.screenName ? {
				'screen_name': data.screenName
			} : {
				'id': data.userId
			};

			this.iosShareUrl = this.template('twitter://user?', iosData);
		}

		this.shareUrl = this.template('https://twitter.com/intent/user?', {
			screen_name: data.screenName,
			user_id: data.userId
		});
	},

	// set Facebook share URL
	facebook: function(data) {
		this.shareUrl = this.template('https://www.facebook.com/dialog/feed?app_id=961342543922322&redirect_uri=http://facebook.com&', data);
	},

	// set Facebook send URL
	facebookSend: function(data) {
		this.shareUrl = this.template('https://www.facebook.com/dialog/send?app_id=961342543922322&redirect_uri=http://facebook.com&', data);
	},

	// set Google share URL
	google: function(data) {
		this.shareUrl = this.template('https://plus.google.com/share?', data);
	},

	// set Pinterest share URL
	pinterest: function(data) {
		this.shareUrl = this.template('https://pinterest.com/pin/create/bookmarklet/?', data);
	},

	// set LinkedIn share URL
	linkedin: function(data) {
		this.shareUrl = this.template('http://www.linkedin.com/shareArticle?', data);
	},

	// set Buffer share URL
	buffer: function(data) {
		this.shareUrl = this.template('http://bufferapp.com/add?', data);
	},

	// set Tumblr share URL
	tumblr: function(data) {
		this.shareUrl = this.template('https://www.tumblr.com/widgets/share/tool?', data);
	},

	// set Reddit share URL
	reddit: function(data) {
		this.shareUrl = this.template('http://reddit.com/submit?', data);
	},

	// set WhatsApp share URL
	whatsapp: function(data) {
		this.shareUrl = this.template('whatsapp://send?', data);
	},

	// set sms share URL
	sms: function(data) {
		this.shareUrl = this.template(this.ios ? 'sms:&' : 'sms:?', data);
	},

	// set Email share URL
	email: function(data) {

		var url = `mailto:`;

		// if to address specified then add to URL
		if (data.to !== null) {
			url += `${data.to}`;
		}

		url += `?`;

		this.shareUrl = this.template(url, {
			subject: data.subject,
			body: data.body
		});
	}
};
