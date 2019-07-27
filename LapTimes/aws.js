function AwsRequest4(options) {
	/* Creates a request that uses AWS Signature Version 4 */
	var defaults = AwsOptions || {};

	defaults.region = typeof(defaults.region) === 'undefined' ? '' : defaults.region;
	defaults.service = typeof(defaults.service) === 'undefined' ? '' : defaults.service;
	defaults.accessKey = typeof(defaults.accessKey) === 'undefined' ? '' : defaults.accessKey;
	defaults.secretKey = typeof(defaults.secretKey) === 'undefined' ? '' : defaults.secretKey;
	defaults.trace = typeof(defaults.trace) === 'undefined' ? false : defaults.trace;
	defaults.debug = typeof(defaults.debug) === 'undefined' ? false : defaults.debug;

	var me = this;
	var scheme = options.scheme || "http";
	var host = options.host || "localhost";
	var path = options.path || "/";
	var method = options.method || "GET";
	var query = options.query || "";
	var headers = options.headers || {};
	var payload = options.payload || "";
	var success = typeof(options.success) == 'function' ? options.success : function() { };
	var failure = typeof(options.failure) == 'function' ? options.failure : function() { };
	var async = typeof(options.async) === 'undefined' ? true : options.async;
	var region = options.region || defaults.region;
	var service = options.service || defaults.service;
	var accessKey = options.accessKey || defaults.accessKey;
	var secretKey = options.secretKey || defaults.secretKey;
	var requestDate = options.requestDate || new Date();
	requestDate = new Date(requestDate.getTime() + (requestDate.getTimezoneOffset() * 60000));

	var reqDateOnly = '' + requestDate.getFullYear() + (requestDate.getMonth() < 9 ? '0' : '') + (requestDate.getMonth() + 1) + (requestDate.getDate() < 10 ? '0' : '') + requestDate.getDate();
	var reqDate = reqDateOnly + 'T';
	reqDate += (requestDate.getHours() < 10 ? '0' : '') + requestDate.getHours();
	reqDate += (requestDate.getMinutes() < 10 ? '0' : '') + requestDate.getMinutes();
	reqDate += (requestDate.getSeconds() < 10 ? '0' : '') + requestDate.getSeconds() + 'Z';

	var debug = options.debug || defaults.debug;
	var trace = debug || options.trace || defaults.trace;

	var signedHeaders = new Array();
	var tempHeaders = {};
	var tempHeader, hdrValue;
	for(var header in headers) {
		tempHeader = header.toLowerCase();
		hdrValue = headers[header];

		if(typeof(tempHeaders[tempHeader]) === 'undefined') {
			tempHeaders[tempHeader] = new Array();
			signedHeaders.push(tempHeader);
		}

		if(hdrValue instanceof Array) {
			for(var i = 0; i < hdrValue.length; i++) {
				tempHeaders[tempHeader].push(hdrValue[i]);
			}
		}
		else {
			tempHeaders[tempHeader].push(hdrValue);
		}
	}
	headers = tempHeaders;

	for(var header in headers) {
		headers[header] = headers[header].join(',');
	}

	if(!headers['host']) {
		headers['host'] = host;
		signedHeaders.push('host');
	}
	if(!(headers['date'] || headers['x-amz-date'])) {
		headers['x-amz-date'] = reqDate;
		signedHeaders.push('x-amz-date');
	}

	signedHeaders.sort();

	var constructQueryString = function(value) {
		if(typeof(value) == 'object') {
			if(value instanceof Array) {
				value.sort();
				for(var i = 0; i < value.length; i++) {
					if(value[i]) {
						value[i] = encodeURIComponent(value[i]);
					}
				}

				return value.join('&');
			}
			else {
				var keys = new Array();
				var val;

				for(var key in value) {
					val = value[key];
					if(val === null || val instanceof Date || typeof(val) === 'string' || typeof(val) === 'number' || typeof(val) === 'boolean') {
						keys.push(key);
					}
				}

				keys.sort();

				var values = new Array();
				for(var i = 0; i < keys.length; i++) {
					val = value[keys[i]];
					if(val === null) {
						values.push(encodeURIComponent(keys[i]));
					}
					else if(val instanceof Date) {
						values.push(encodeURIComponent(keys[i]) + '=' + encodeURIComponent(JSON.stringify(val)));
					}
					else {
						values.push(encodeURIComponent(keys[i]) + '=' + encodeURIComponent(val));
					}
				}

				return values.join('&');
			}
		}
		else {
			return encodeURIComponent("" + value);
		}
	};

	var splitQueryString = function(value) {
		var split = {};
		split.map = {};
		split.decodedMap = {};
		split.keys = new Array();
		split.decodedKeys = new Array();

		value.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(match, key, val) {
			if(key) {
				split.map[key] = val;
				split.keys.push(key);

				key = decodeURIComponent(key);
				split.decodedMap[key] = decodeURIComponent(val);
				split.decodedKeys.push(key);
			}
		});

		return split;
	};

	var constructCanonicalHash = function() {
		var req = new Array();
		req.push(method);
		req.push(path);
		
		if(query) {
			var sortedQuery = new Array();
			var qSplit = splitQueryString(query);

			qSplit.keys.sort();
			for(var i = 0; i < qSplit.keys.length; i++) {
				sortedQuery.push(qSplit.keys[i] + (qSplit.map[qSplit.keys[i]] ? '=' + qSplit.map[qSplit.keys[i]] : ''));
			}

			req.push(sortedQuery.join('&'));
		}
		else {
			req.push('');
		}

		var hdrVals = new Array();
		for(var i = 0; i < signedHeaders.length; i++) {
			hdrVals.push(signedHeaders[i]);
			hdrVals.push(':');
			hdrVals.push(headers[signedHeaders[i]]);
			hdrVals.push('\n');
		}

		req.push(hdrVals.join(''));
		req.push(signedHeaders.join(';'));

		if(debug) { console.log('Payload: ' + payload); }
		req.push(CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex).toLowerCase());

		var canonical = req.join('\n');
		if(debug) { console.log('Canonical: ' + canonical); }
		return CryptoJS.SHA256(canonical).toString(CryptoJS.enc.Hex).toLowerCase();
	};

	var constructSigningKey = function() {
		var kDate = CryptoJS.HmacSHA256(reqDateOnly, "AWS4" + secretKey);
		if(debug && console.log) { console.log('kDate: ' + kDate.toString(CryptoJS.enc.Hex)); }
		var kRegion = CryptoJS.HmacSHA256(region, kDate);
		if(debug && console.log) { console.log('kRegion: ' + kRegion.toString(CryptoJS.enc.Hex)); }
		var kService = CryptoJS.HmacSHA256(service, kRegion);
		if(debug && console.log) { console.log('kService: ' + kService.toString(CryptoJS.enc.Hex)); }
		var kSigning = CryptoJS.HmacSHA256("aws4_request", kService);
		if(debug && console.log) { console.log('kSigning: ' + kSigning.toString(CryptoJS.enc.Hex)); }
		
		return kSigning;
	};

	if(typeof(query) !== 'string') {
		query = constructQueryString(query);
	}

	if(typeof(payload) !== 'string') {
		payload = constructQueryString(payload);
	}

	var canonicalHash = constructCanonicalHash();
	if(debug && console.log) { console.log('Canonical Hash: ' + canonicalHash); }
	var credentialScope = reqDateOnly + '/' + region + '/' + service + '/aws4_request';
	var stringToSign = 'AWS4-HMAC-SHA256\n' + reqDate + '\n' + credentialScope + '\n' + canonicalHash;
	if(debug && console.log) { console.log('String To Sign: ' + stringToSign); }
	var signingKey = constructSigningKey();
	var signature = CryptoJS.HmacSHA256(stringToSign, signingKey).toString(CryptoJS.enc.Hex).toLowerCase();
	if(debug && console.log) { console.log('Signature: ' + signature); }
	headers['Authorization'] = 'AWS4-HMAC-SHA256 Credential=' + accessKey + '/' + credentialScope + ', SignedHeaders=' + signedHeaders.join(';') + ', Signature=' + signature;

	if(options.addSignatureToQuery) {
		query += '&Signature=' + signature;
	}
	if(options.addSignatureToPayload) {
		payload += '&Signature=' + signature;
	}
	var url = scheme + '://' + host + path + (query ? "?" : "") + query;

	if(trace && console.log)
	{
		var msg = new Array();
		msg.push(method + ' ' + url + ' HTTP/1.1');
		for(var header in headers) {
			msg.push(header + ': ' + headers[header]);
		}
		msg.push('');
		msg.push(payload);

		console.log('AWS Request\n    ' + msg.join('\n').replace(/\n/g, '\n    '));
	}

	var xhr = null;

	var handleReadyStateChange = function() {
		if(debug && console.log) { console.log('Ready state changed to ' + xhr.readyState); }

		if(xhr.readyState == 4) {
			handleFinished();
		}
	};

	var handleFinished = function() {
		if(xhr.status > 399) {
			if(debug && console.log) { console.log('Request Failed (' + xhr.status + ')'); }
			failure(xhr.status, xhr.responseText, xhr);
		}
		else if(xhr.status == 200 || xhr.status === 0) {
			if(trace && console.log) { console.log('Response: ' + xhr.responseText); }
			var xml = null;

			try
			{
				xml = xhr.responseXML || null;
			}
			catch(e)
			{
				if(debug && console.log) { console.log('Could not parse XML: ' + e); }
			}

			success(xhr.responseText, xml, xhr);
		}
	};

	me.invoke = function(onSuccess, onFailure) {
		success = onSuccess || success;
		failure = onFailure || failure;

		if(debug && console.log) { console.log('AWS Request 4 invoked: ' + url); }
		xhr = new XMLHttpRequest();
		xhr.open(method, url, async);

		for(var header in headers) {
			if(header.toLowerCase() != 'host') {
				xhr.setRequestHeader(header, headers[header]);
			}
		}

		if(async) {
			xhr.onreadystatechange = handleReadyStateChange;
		}

		xhr.send(payload);

		if(async) {
			if(debug && console.log) { console.log('AWS Request 4 sent'); }
		}
		else {
			if(debug && console.log) { console.log('AWS Request 4 sent with status ' + xhr.status); }
			handleFinished();
		}
	}
}

function sendAwsRequest(url, action, options, success, failure)
{
	if(typeof(options) === 'function') {
		failure = success;
		success = options;
		options = null;
	}

	options = options || {};
	options.method = options.method || 'POST';
	options.scheme = options.scheme || url.scheme;
	options.host = options.host || url.host;
	options.path = options.path || url.path;
	options.payload = options.payload || {};
	options.success = success || options.success;
	options.success = typeof(options.success) !== 'function' ? function() {} : options.success;
	options.failure = failure || options.failure;
	options.failure = typeof(options.failure) !== 'function' ? function() {} : options.failure;
	options.accessKey = options.accessKey || AwsOptions.accessKey;
	options.secretKey = options.secretKey || AwsOptions.secretKey;

	if(options.method == 'POST') {
		options.headers = options.headers || {};
		if(!options.headers['Content-Type']) {
			options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		}
	}

	var reqDate = new Date();
	options.payload.Action = action;
	options.payload.Timestamp = reqDate.toISOString();
	options.payload.Version = '2012-11-05';
	options.payload.AWSAccessKeyId = options.accessKey;
	options.payload.SignatureMethod = 'HmacSHA256';
	options.payload.SignatureVersion = '4';
	options.requestDate = reqDate;

	var req = new AwsRequest4(options);

	req.invoke(success, failure);
};
