/**
* Configure data attribute API
*/
module.exports = class DataAttr {

    constructor(OpenShare) {
        this.OpenShare = OpenShare;

        document.addEventListener('open-share-init', this.init.bind(this));
        this.init();
    }

    init() {
        // loop through open share node collection
        let nodes = document.querySelectorAll('[data-open-share]:not([data-open-share-node])');
        [].forEach.call(nodes, this.initializeNode.bind(this));
    }

    initializeNode(os) {
        // initialize open share object with type attribute
        let type = os.getAttribute('data-open-share'),
            dash = type.indexOf('-'),
            openShare;

        // type contains a dash
        // transform to camelcase for function reference
        // TODO: only supports single dash, should should support multiple
        if (dash > -1) {
            let nextChar = type.substr(dash + 1, 1),
                group = type.substr(dash, 2);

            type = type.replace(group, nextChar.toUpperCase());
        }

        openShare = new this.OpenShare(type);

        // specify if this is a dynamic instance
        if (os.getAttribute('data-open-share-dynamic')) {
            openShare.dynamic = true;
        }

        // set all optional attributes on open share instance
        this.setData(openShare, os);

        // open share dialog on click
        os.addEventListener('click', (e) => {

            // if dynamic instance then fetch attributes again in case of updates
            if (openShare.dynamic) {
                this.setData(openShare, e.currentTarget);
            }

            openShare.share(e);
        });

        os.setAttribute('data-open-share-node', type);
    }

    setData(osInstance, osElement) {
        osInstance.setData({
            url: osElement.getAttribute('data-open-share-url'),
            text: osElement.getAttribute('data-open-share-text'),
            via: osElement.getAttribute('data-open-share-via'),
            hashtags: osElement.getAttribute('data-open-share-hashtags'),
            ios: osElement.getAttribute('data-open-share-ios'),
            tweetId: osElement.getAttribute('data-open-share-tweet-id'),
            related: osElement.getAttribute('data-open-share-related'),
            screenName: osElement.getAttribute('data-open-share-screen-name'),
            userId: osElement.getAttribute('data-open-share-user-id'),
            link: osElement.getAttribute('data-open-share-link'),
            picture: osElement.getAttribute('data-open-share-picture'),
            caption: osElement.getAttribute('data-open-share-caption'),
            description: osElement.getAttribute('data-open-share-description'),
            title: osElement.getAttribute('data-open-share-title'),
            media: osElement.getAttribute('data-open-share-media'),
            to: osElement.getAttribute('data-open-share-to'),
            subject: osElement.getAttribute('data-open-share-subject'),
            body: osElement.getAttribute('data-open-share-body')
        });
    }
};
