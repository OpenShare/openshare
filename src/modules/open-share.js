/**
* OpenShare generates a single share link
*/
module.exports = class OpenShare {

    constructor(type) {

        // throw error if invalid type provided
        if (!this[type]) {
            throw new Error(`Open Share: ${type} is an invalid type`);
        }

        this.ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.type = type;
        this.dynamic = false;

        // capitalized type
        this.typeCaps = type.charAt(0).toUpperCase() + type.slice(1);
    }

    // returns function named as type set in constructor
    // e.g twitter()
    setData(data) {
        return this[this.type](data);
    }

    // open share URL defined in individual platform functions
    share(e)  {
        // if iOS share URL has been set then use timeout hack
        // test for native app and fall back to web
        if (this.iosShareUrl) {

            window.location = this.iosShareUrl;

            setTimeout(() => {
                // if the user is still here, fall back to web
                if (!document.webkitHidden) {
                    window.open(this.shareUrl, 'OpenShare');
                }
            }, 25);

        // open mailto links in same window
        } else if (this.type === 'email') {
            window.location = this.shareUrl;

        // open social share URLs in new window
        } else {
            window.open(this.shareUrl, 'OpenShare');
        }
    }

    // create share URL with GET params
    // appending valid properties to query string
    template(url, data) {
        let shareUrl = url,
            i;

        for (i in data) {
            // only append valid properties
            if (!data[i]) {
                continue;
            }

            // append URL encoded GET param to share URL
            data[i] = encodeURIComponent(data[i]);
            shareUrl += `${i}=${data[i]}&`;
        }

        return shareUrl.substr(0, shareUrl.length - 1);
    }

    // test for valid required properties
    validate(req, obj) {

        req.forEach((val) => {

            // check for OR values
            if (val.includes('|')) {

                var error = true;
                val = val.split('|');

                val.forEach((childVal) => {
                    if (obj[childVal]) {
                        error = false;
                    }
                });

                if (error) {
                    this.missingOptions(val);
                }

            } else if (!obj[val]) {
                this.missingOptions(val);
            }
        });

        return true;
    }

    missingOptions(options) {
        let errorMsg = `Open Share ${this.typeCaps}: missing `;

        if (Array.isArray(options)) {
            options.forEach((option) => {
                errorMsg += `${option} or `;
            });

            errorMsg = errorMsg.substring(0, errorMsg.length - 4);
        } else if (typeof options === 'string') {
            errorMsg += `${options} attribute`;
        }

        throw new Error(errorMsg);
    }

    // set Twitter share URL
    twitter(data) {
        this.validate(['url|text'], data);

        // if iOS user and ios data attribute defined
        // build iOS URL scheme as single string
        if (this.ios && data.ios) {

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

            this.iosShareUrl = this.template('twitter://post?', {
                message: message
            });
        }

        this.shareUrl = this.template('https://twitter.com/share?', {
            url: data.url,
            text: data.text,
            via: data.via,
            hashtags: data.hashtags
        });
    }

    // set Twitter retweet URL
    twitterRetweet(data) {
        this.validate(['tweetId'], data);

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
    }

    // set Twitter like URL
    twitterLike(data) {
        this.validate(['tweetId'], data);
        this.shareUrl = this.template('https://twitter.com/intent/favorite?', {
            tweet_id: data.tweetId,
            related: data.related
        });
    }

    // set Twitter follow URL
    twitterFollow(data) {
        this.validate(['screenName|userId'], data);
        this.shareUrl = this.template('https://twitter.com/intent/user?', {
            screen_name: data.screenName,
            user_id: data.userId
        });
    }

    // set Facebook share URL
    facebook(data) {
        this.validate(['link'], data);
        this.shareUrl = this.template('https://www.facebook.com/dialog/feed?app_id=961342543922322&redirect_uri=http://facebook.com&', {
            link: data.link,
            picture: data.picture,
            caption: data.caption,
            description: data.description
        });
    }

	// set Facebook send URL
    facebookSend(data) {
        this.validate(['link'], data);
        this.shareUrl = this.template('https://www.facebook.com/dialog/send?app_id=961342543922322&redirect_uri=http://facebook.com&', {
            link: data.link
        });
    }

    // set Google share URL
    google(data) {
        this.validate(['url'], data);
        this.shareUrl = this.template('https://plus.google.com/share?', {
            url: data.url
        });
    }

    // set Pinterest share URL
    pinterest(data) {
        this.validate(['media'], data);
        this.shareUrl = this.template('https://pinterest.com/pin/create/bookmarklet/?', {
            media: data.media,
            url: data.url,
            description: data.description
        });
    }

    // set LinkedIn share URL
    linkedin(data) {
        this.validate(['url'], data);
        this.shareUrl = this.template('http://www.linkedin.com/shareArticle?', {
            url: data.url,
            title: data.title
        });
    }

    // set Buffer share URL
    buffer(data) {
        this.validate(['url'], data);
        this.shareUrl = this.template('http://bufferapp.com/add?', {
            url: data.url,
            text: data.text
        });
    }

    // set Tumblr share URL
    tumblr(data) {
        this.validate(['url'], data);
        this.shareUrl = this.template('https://www.tumblr.com/widgets/share/tool?', {
            url: data.url,
            title: data.title,
            caption: data.caption
        });
    }

    // set Reddit share URL
    reddit(data) {
        this.validate(['url'], data);
        this.shareUrl = this.template('http://reddit.com/submit?', {
            url: data.url,
            title: data.title
        });
    }

    // set WhatsApp share URL
    whatsapp(data) {
        this.validate(['text'], data);
        this.shareUrl = this.template('whatsapp://send?', {
            text: data.text
        });
    }

    // set sms share URL
    sms(data) {
        this.validate(['body'], data);
        this.shareUrl = this.template(this.ios ? 'sms:&' : 'sms:?', {
            body: data.body
        });
    }

    // set Email share URL
    email(data) {

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
