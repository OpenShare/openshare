/**
* OpenShare generates a single share link
*/
module.exports = class OpenShare {

    constructor(type) {

        // throw error if invalid type provided
        if (!this[type]) {
            throw new Error(`Open Share: ${type} is an invalid type`);
        }

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
        // open mailto links in same window
        if (this.type === 'email') {
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
        let i = null;

        // throw error if required property invalid
        for (i of req) {
            if (!obj[i]) {
                throw new Error(`Open Share ${this.typeCaps}: missing ${i} attribute`);
            }
        }

        return true;
    }

    // set Twitter share URL
    twitter(data) {
        this.validate(['url'], data);
        this.shareUrl = this.template('https://twitter.com/share?', {
            url: data.url,
            text: data.text,
            via: data.via,
            hashtags: data.hashtags
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
    linkedIn(data) {
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

    // set Email share URL
    email(data) {
        this.validate(['to'], data);
        this.shareUrl = this.template(`mailto:${data.to}?`, {
            subject: data.subject,
            body: data.body
        });
    }
};
