(function(){
	'use strict';

	var lithe = function (selector, context) {
		return new NodeList(selector, context);
	},
	forEach = Array.prototype.forEach,
	slice = Array.prototype.slice;

	lithe.extend = function (obj) {
		forEach.call(slice.call(arguments, 1), function (source) {
			var prop;
			for (prop in source)
				obj[prop] = source[prop];
		});

		return obj;
	};

	lithe.toArray = function (obj) {
		return obj.length !== undefined ? slice.call(obj) : [obj];
	};

	// Selector
	lithe.q1 = function (selector) {
		if (typeof selector === 'string')
			selector = document.querySelector(selector);
		return new NodeList(document.querySelector(selector));
	};

	function NodeList(selector, context) {
		var nodes;

		context = context || document;

		if (typeof selector === 'string') {
			if (typeof context === 'string') {
				selector = context + ' ' + selector;
				context = document;
			}

			if (selector.indexOf(' ') < 0) {
				switch (selector[0]) {
					case '#':
						nodes = [context.getElementById(selector.substr(1))];
						break;
					case '.':
						nodes = context.getElementsByClassName(selector.substr(1));
						break;
					default:
						nodes = context.getElementsByTagName(selector);
				}
			}
			else
				nodes = context.querySelectorAll(selector);
		}
		else if (selector && selector.nodeType)
			nodes = [selector];
		else
			nodes = selector;

		this.push.apply(this, nodes);
	}

	NodeList.prototype = [];

	NodeList.prototype.slice = function () {
		return lithe(slice.apply(this, arguments));
	};

	NodeList.prototype.concat = function () {
		var copy = lithe.toArray(this);

		return lithe(lithe.toArray(arguments).reduce(function (list, nodeList) {
			return list.concat(lithe.toArray(nodeList));
		}, copy));
	};

	NodeList.prototype.find = function (selector) {
		return this.reduce(function (list, elem) {
			return list.concat(lithe(selector, elem));
		}, lithe());
	};

	NodeList.prototype.children = function (selector) {
		return this.reduce(function (list, elem) {
			return list.concat(elem.children);
		}, lithe());
	};

	NodeList.prototype.parent = function (selector) {
		return this.reduce(function (list, elem) {
			return list.concat(elem.children);
		}, lithe()).filter(function (elem, index, nodeList) {
			return nodeList.indexOf(elem) === index;
		});
	};

	NodeList.prototype.hide = function () {
		this.forEach(function (elem) {
			elem.style.display = 'none';
		});

		return this;
	};

	NodeList.prototype.show = function () {
		this.forEach(function (elem) {
			elem.style.display = elem.style.display === 'none' ? '' : 'block';
		});

		return this;
	};

	// Events
	NodeList.prototype.on = function (events, selector, callback) {
		events = events.split(' ');
		this.forEach(function (elem) {
			events.forEach(function (event) {
				elem.addEventListener(event, function (e) {
					var matchIndex = elem.find(selector).indexOf(e.target);

					if (matchIndex >= 0)
						callback.call(e.target);
				});
			});
		});

		return this;
	};

	NodeList.prototype.off = function (events, selector, callback) {

	};

	NodeList.prototype.trigger = function (events) {

	};


	// Ajax
	lithe.serialize = function (obj) {
		var prop, params;
		for (prop in obj)
			params.push(encodeURIComponent(prop) + '=' + encodeURIComponent(obj[prop]));
		return params.join('&');
	};

	lithe.ajax = function (options) {
		var defaults = {
			headers: {},
			type: 'GET'
		},
		settings = lithe.extend(defaults, options),
		request = new XMLHttpRequest(),
		name;

		if (settings.data) {
			settings.data = lithe.serialize(settings.data);

			if (settings.url === 'GET')
				settings.url += '?' + settings.data;
		}

		request.open(settings.type, settings.url);
		request.onreadystatechange = function () {

			// Request complete
			if (request.readyState === 4) {
				if (typeof settings.complete === 'function')
					settings.complete(request);

				if (request.status === 200 && typeof settings.success === 'function')
					settings.success(request.responseText, request);

				else if (typeof settings.error === 'function')
					settings.error(request);
			}
		};

		for (name in settings.headers)
			request.setRequestHeader(name, settings.headers[name]);

		request.send(settings.data);

		return request;
	};

	lithe.get = function (url, success) {
		return lithe.ajax({url: url, success: success});
	};

	lithe.ajaxJSONP = function (options) {
		var script = document.createElement('script');
	};

	// Templating
	lithe.template = function (template, data) {
		var render = function (template, data) {
			var key, val;
			for (key in data) {
				val = data[key];
				template = template.replace(new RegExp('{{' + key + '}}', 'g'), val);
			}
			return template;
		};
		return data
			? render(template, data)
			: function (data) {
				return render(template, data);
			};
	};

	this.$ = this.lithe = lithe;
}).call(this);