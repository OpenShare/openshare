/**
 * Global OpenShare API to generate instances programmatically
 */
import OS from './open-share';
import ShareTransforms from './share-transforms';
import Events from './events';
import dashToCamel from '../../lib/dashToCamel';

export default () => {
  // global OpenShare referencing internal class for instance generation
  class OpenShare {

    constructor(data, element) {
      if (!data.bindClick) data.bindClick = true;

      const dash = data.type.indexOf('-');

      if (dash > -1) {
        data.type = dashToCamel(dash, data.type);
      }

      let node;
      this.element = element;
      this.data = data;

      this.os = new OS(data.type, ShareTransforms[data.type]);
      this.os.setData(data);

      if (!element || data.element) {
        element = data.element;
        node = document.createElement(element || 'a');
        if (data.type) {
          node.classList.add('open-share-link', data.type);
          node.setAttribute('data-open-share', data.type);
          node.setAttribute('data-open-share-node', data.type);
        }
        if (data.innerHTML) node.innerHTML = data.innerHTML;
      }
      if (node) element = node;

      if (data.bindClick) {
        element.addEventListener('click', () => {
          this.share();
        });
      }

      if (data.appendTo) {
        data.appendTo.appendChild(element);
      }

      if (data.classes && Array.isArray(data.classes)) {
        data.classes.forEach((cssClass) => {
          element.classList.add(cssClass);
        });
      }

      if (data.type.toLowerCase() === 'paypal') {
        const action = data.sandbox ?
        'https://www.sandbox.paypal.com/cgi-bin/webscr' :
        'https://www.paypal.com/cgi-bin/webscr';

        const buyGIF = data.sandbox ?
        'https://www.sandbox.paypal.com/en_US/i/btn/btn_buynow_LG.gif' :
        'https://www.paypalobjects.com/en_US/i/btn/btn_buynow_LG.gif';

        const pixelGIF = data.sandbox ?
        'https://www.sandbox.paypal.com/en_US/i/scr/pixel.gif' :
        'https://www.paypalobjects.com/en_US/i/scr/pixel.gif';


        const paypalButton = `<form action=${action} method="post" target="_blank">

        <!-- Saved buttons use the "secure click" command -->
        <input type="hidden" name="cmd" value="_s-xclick">

        <!-- Saved buttons are identified by their button IDs -->
        <input type="hidden" name="hosted_button_id" value="${data.buttonId}">

        <!-- Saved buttons display an appropriate button image. -->
        <input type="image" name="submit"
        src=${buyGIF}
        alt="PayPal - The safer, easier way to pay online">
        <img alt="" width="1" height="1"
        src=${pixelGIF} >

        </form>`;

        const hiddenDiv = document.createElement('div');
        hiddenDiv.style.display = 'none';
        hiddenDiv.innerHTML = paypalButton;
        document.body.appendChild(hiddenDiv);

        this.paypal = hiddenDiv.querySelector('form');
      }

      this.element = element;
      return element;
    }

    // public share method to trigger share programmatically
    share(e) {
      // if dynamic instance then fetch attributes again in case of updates
      if (this.data.dynamic) {
        //eslint-disable-next-line
        this.os.setData(data);// data is not defined
      }

      if (this.data.type.toLowerCase() === 'paypal') {
        this.paypal.submit();
      } else this.os.share(e);

      Events.trigger(this.element, 'shared');
    }
  }

  return OpenShare;
};
