function init() {
    require('./lib/init')({
        api: 'count',
        selector: '[data-open-share-count]:not([data-open-share-node])',
        cb: require('./lib/initializeCountNode')
    })();
}
module.exports = function() {
    if (document.readyState === "complete") {
        init();
    }
    document.addEventListener("readystatechange", function() {
        if (document.readyState === "complete") {
            init();
        }
    },false);
    return require('./src/modules/count-api')();
};
