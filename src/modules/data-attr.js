/**
* Configure data attribute API
*/
module.exports = class DataAttr {

    constructor(OpenShare) {
        this.OpenShare = OpenShare;

        let nodes = document.querySelectorAll('[data-open-share]'),
            os;

        // loop through open share node collection
        for (os of nodes) {
            this.initializeNode(os);
        }
    }

    initializeNode(os) {
        // initialize open share object with type attribute
        let type = os.getAttribute('data-open-share'),
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
    }

    setData(osInstance, osElement) {
        osInstance.setData({
            url: osElement.getAttribute('data-open-share-url'),
            text: osElement.getAttribute('data-open-share-text'),
            via: osElement.getAttribute('data-open-share-via'),
            hashtags: osElement.getAttribute('data-open-share-hashtags'),
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
