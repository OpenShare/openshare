# OpenShare

OpenShare provides straightforward, declarative, and completely customizable API wrappers for sharing and counting on major social networks and platforms. Zero styling, maximum flexibility. But, unlike other social sharing tools, we don't retarget and profit from your users. Your data is your data — this is OpenShare.

[Check out the examples](http://openshare.social/examples) to see OpenShare in action or [dive right into the documentation](https://github.com/dsurgeons/OpenShare/wiki).

* [Getting Started](https://github.com/dsurgeons/OpenShare/wiki/1.-Getting-Started)
* [Data Attribute API](https://github.com/dsurgeons/OpenShare/wiki/2.-Data-Attribute-API)
* [JavaScript API](https://github.com/dsurgeons/OpenShare/wiki/3.-JavaScript-API)
* [Automated Analytics Integrations](https://github.com/dsurgeons/OpenShare/wiki/4.-Automated-Analytics-Integrations)
* [Contributing](https://github.com/dsurgeons/OpenShare/wiki/5.-Contributing)
* [Examples](http://openshare.social/examples)


---
**Quick Start**

```
$ npm install openshare --save
```

```html
<a data-open-share="facebook"
	data-open-share-link="http://digitalsurgeons.com"
	data-open-share-caption="Digital Surgeons"
	data-open-share-description="Forward Obsessed">
	Share

	<span data-open-share-count="facebook"
		  data-open-share-count-url="https://www.digitalsurgeons.com"></span>
</a>
```

---
**MIT License (MIT)**

Copyright (c) 2015 Digital Surgeons

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
