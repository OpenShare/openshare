function init() {
    require('../../lib/init')({
        selector: {
            share: '[data-open-share]:not([data-open-share-node])',
            count: '[data-open-share-count]:not([data-open-share-node])'
        },
        cb: {
            share: require('../../lib/initializeShareNode'),
            count: require('../../lib/initializeCountNode')
        }
    })();
}
module.exports = function() {
    if (document.readyState === "complete") {
        return init();
    }
    document.addEventListener("readystatechange", function() {
        if (document.readyState === "complete") {
            init();
        }
    },false);
};
