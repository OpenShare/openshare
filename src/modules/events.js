/**
 * Trigger custom OpenShare namespaced event
 */
export default {
  trigger(element, event) {
    const ev = document.createEvent('Event');
    ev.initEvent(`OpenShare.${event}`, true, true);
    element.dispatchEvent(ev);
  },
};
