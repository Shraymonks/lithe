(function () {
	'use strict';

	var lithe = function (selector, context) {
		return new NodeList(selector, context);
	},
	forEach = [].forEach,
	slice = [].slice;

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

	lithe.unique = function (array) {
		return array.filter(function (elem, index) {
			return array.indexOf(elem) === index;
		});
	};

	function NodeList(selector, context) {
		var nodes;

		context = context || document;

		if (typeof selector === 'string') {
			if (typeof context === 'string') {
				selector = context + ' ' + selector;
				context = document;
			}
			nodes = context.querySelectorAll(selector);
		}
		else if (selector && selector.nodeType)
			nodes = [selector];
		else
			nodes = selector;

		this.push.apply(this, nodes);
	}

	NodeList.prototype = [];

	['slice', 'filter', 'map'].forEach(function (method) {
		NodeList.prototype[method] = function () {
			return lithe(Array.prototype[method].apply(this, arguments));
		};
	});

	NodeList.prototype.concat = function () {
		return lithe(
			lithe.toArray(arguments).reduce(function (list, nodeList) {
				return list.concat(lithe.toArray(nodeList));
			}, lithe.toArray(this))
		);
	};

	NodeList.prototype.find = function (selector) {
		return lithe.unique(
			this.reduce(function (list, elem) {
				return list.concat(lithe(selector, elem));
			}, lithe())
		);
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

	NodeList.prototype.append = function () {
		var frag = document.createDocumentFragment();

		lithe.toArray(arguments).forEach(function (elem) {
			// lithe object
			if (elem instanceof NodeList)
				elem.forEach(function (elem) {
					frag.appendChild(elem);
				});
			// html string
			else if (typeof elem === 'string')
				frag.insertAdjacentHTML('beforeEnd', elem);
			// element
			else
				frag.appendChild(elem);
		});
		this.forEach(function (elem) {
			elem.appendChild(frag.cloneNode(true));
		});

		return this;
	};

	NodeList.prototype.html = function (html) {
		if (typeof html === 'undefined')
			return this[0].innerHTML;

		this.forEach(function (elem) {
			elem.innerHTML = html;
		});

		return this;
	};

	NodeList.prototype.attr = function (name, value) {
		if (typeof value === 'undefined')
			return this[0].getAttribute(name);

		this.forEach(function (elem) {
			elem.setAttribute(name, value);
		});

		return this;
	};

	// TODO
	NodeList.prototype.animate = function (options) {
		var defaults = {
			duration: 400,
			easing: 'ease'
		},
		settings = lithe.extend(defaults, options);
	};

	NodeList.prototype.css = function (css) {
		this.forEach(function (elem) {
			var cssText = '', prop;
			for (prop in css)
				cssText += prop + ':' + css[prop] + ';';
			elem.style.cssText = cssText;
		});

		return this;
	};

	NodeList.prototype.addClass = function (className) {
		this.forEach(function (elem) {
			if (elem.className.indexOf(new RegExp('\b' + className + '\b')) < 0)
				elem.className += ' ' + className;
		});
	};

	NodeList.prototype.removeClass = function (className) {
		this.forEach(function (elem) {
			elem.className = elem.className.replace(new RegExp('\b' + className + '\b', 'g'), '');
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
		var cb;
		events = events.split(/\s+/);
		if (typeof selector === 'function') {
			cb = callback = selector;
			selector = null;
		}
		else
			cb = function (e, elem, selector) {
				var matchIndex = lithe(elem).find(selector).indexOf(e.target);

				if (matchIndex >= 0)
					callback.call(e.target, e);
			};

		this.forEach(function (elem) {
			events.forEach(function (event) {
				elem.addEventListener(event, function (e) {
					cb.call(e.currentTarget, e, elem, selector);
				});
			});
		});

		return this;
	};

	// TODO
	NodeList.prototype.off = function (events, selector, callback) {

	};

	// TODO
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

				// Success
				if ((request.status >= 200 && request.status < 300 || request.status === 304)
					&& typeof settings.success === 'function')

					settings.success(request.responseText, request);

				// Error
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

	// TODO
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