# OpenShare

OpenShare is social sharing for developers. A simple wrapper around popular share APIs, zero styling, maximum flexibility and a declarative API. [Check out the example page](http://dsurgeons.github.io/OpenShare/) to see it in action.


## Installation ##

To get started, install the [Bower](http://bower.io/) package or directly download open-share.js and include in your page or as part of a build process. And that's it! Everything else is expressed using data-attributes directly within your HTML, read on for more.

	# install package with Bower
	$ bower install --save open-share

## Implementation

All OpenShare instances are created directly in the DOM using data attributes, here's a basic Facebook share.

	<button data-open-share="facebook"
			data-open-share-link="http://digitalsurgeons.com">
		
		Share on Facebook
		
	</button>

When clicked, this button will open a Facebook Share Dialog in a new window using the information specified in the open-share data attributes. For a full list of attribute options read on.

## API Reference

Here is the complete OpenShare API reference. Each OpenShare instance will be initialized with `data-open-share="{platform}"`.

### Facebook ####

Initialize an OpenShare Facebook instance with `data-open-share="facebook"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-link           | Required
| data-open-share-picture        | 
| data-open-share-caption        | 
| data-open-share-description    |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating			

### Twitter ####

Initialize an OpenShare Twitter instance with `data-open-share="twitter"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-text           | 
| data-open-share-via            | Username without @
| data-open-share-hashtags       | Comma separated
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

### Facebook ####

Initialize an OpenShare Facebook instance with `data-open-share="facebook"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-link           | Required
| data-open-share-picture        | 
| data-open-share-caption        | 
| data-open-share-description    |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating		

### Google ####

Initialize an OpenShare Google instance with `data-open-share="google"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

### Pinterest ####

Initialize an OpenShare Pinterest instance with `data-open-share="pinterest"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-media          | Required. URL of image to pin
| data-open-share-url            | URL to share with image
| data-open-share-description    |		
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating	

### LinkedIn ####

Initialize an OpenShare LinkedIn instance with `data-open-share="linkedIn"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-title          | 
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

### Buffer ####

Initialize an OpenShare Buffer instance with `data-open-share="buffer"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-text           |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating	


### Tumblr ####

Initialize an OpenShare Tubmlr instance with `data-open-share="tumblr"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-title          |
| data-open-share-caption        |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

### Reddit ####

Initialize an OpenShare Reddit instance with `data-open-share="reddit"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-title          |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

### Digg ####

Initialize an OpenShare Digg instance with `data-open-share="digg"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-title          |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

### StumbleUpon ####

Initialize an OpenShare Twitter instance with `data-open-share="digg"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-title          |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

### Delicious ####

Initialize an OpenShare Twitter instance with `data-open-share="digg"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-url            | Required
| data-open-share-title          |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

### Email ####

Initialize an OpenShare Email instance with `data-open-share="email"` and customize with the following.

| Attribute                      | Notes
| ------------------------------ | ----------------------------
| data-open-share-to             | Required. Email address
| data-open-share-subject        | 
| data-open-share-body           |
| data-open-share-dynamic        | Fetch new attribute values on every share, useful if dynamically updating

## Browser Support ##

OpenShare supports all major browsers including IE9+.


**MIT License (MIT)**

Copyright (c) 2015 Digital Surgeons

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
