/**
 * Trigger custom OpenShare namespaced event
 */
module.exports = {
  trigger(element, event) {
    const ev = document.createEvent('Event');
    ev.initEvent(`OpenShare.${event}`, true, true);
    element.dispatchEvent(ev);
  },
};
