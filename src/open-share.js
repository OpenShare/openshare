(function() {

    // babel runtime polyfill
    // required for some ES6 features
    require('babel/polyfill');

    /**
    * OpenShare generates a single share link
    */
    class OpenShare {

        constructor(type) {
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
            window.open(this.shareUrl, 'OpenShare');
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
                shareUrl += encodeURI(`${i}=${data[i]}&`);
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
                title: data.title,
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
                isVideo: data.isVideo,
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

        // set Digg share URL
        digg(data) {
            this.validate(['url'], data);
            this.shareUrl = this.template('http://digg.com/submit?', {
                url: data.url,
                title: data.title
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

        // set StumbleUpon share URL
        stumbleUpon(data) {
            this.validate(['url'], data);
            this.shareUrl = this.template('http://www.stumbleupon.com/submit?', {
                url: data.url,
                title: data.title
            });
        }

        // set Delicious share URL
        delicious(data) {
            this.validate(['url'], data);
            this.shareUrl = this.template('https://delicious.com/save?v=5&provider=Open%20Share&noui&jump=close&', {
                url: data.url,
                title: data.title
            });
        }
    }

    /**
    * Configure data attribute API
    */

    // open share nodes
    let openShares = document.querySelectorAll('[data-open-share]'),
        os;

    // set all optional attributes from openshjare on open share instance
    function setData(osInstance, osElement) {
        osInstance.setData({
            url: osElement.getAttribute('data-open-share-url'),
            title: osElement.getAttribute('data-open-share-title'),
            via: osElement.getAttribute('data-open-share-via'),
            hashtags: osElement.getAttribute('data-open-share-hashtags'),
            link: osElement.getAttribute('data-open-share-link'),
            picture: osElement.getAttribute('data-open-share-picture'),
            caption: osElement.getAttribute('data-open-share-caption'),
            description: osElement.getAttribute('data-open-share-description'),
            media: osElement.getAttribute('data-open-share-media'),
            isVideo: osElement.getAttribute('data-open-share-isVideo'),
            text: osElement.getAttribute('data-open-share-text')
        });
    }

    // loop through open share node collection
    for (os of openShares) {

        // initialize open share object with type attribute
        let type = os.getAttribute('data-open-share'),
            openShare = new OpenShare(type);

        // specify if this is a dynamic instance
        if (os.getAttribute('data-open-share-dynamic')) {
            openShare.dynamic = true;
        }

        // set all optional attributes on open share instance
        setData(openShare, os);

        // open share dialog on click
        os.addEventListener('click', (e) => {

            // if dynamic instance then fetch attributes again in case of updates
            if (openShare.dynamic) {
                setData(openShare, e.target);
            }

            openShare.share(e);
        });
    }

})();
