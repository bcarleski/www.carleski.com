var publishQueue = { scheme: "https", host:"sqs.us-west-2.amazonaws.com", path:"/439188974788/LapTimeRecords" };
var accessKeyParams = { a: 'ccae2ef663c9a10a818a557b6337828297a1063f620dd90b89065eaccbf6332c', b:'e9ff0614d36f81efd88c7e74bb674af9' };
var secretKeyParams = { a: 'be94c598ab8eada90897bf2fabaaea2470a7d308f46bdbfb5d52882dc8c83be3953fda5ede4d3c404e9b905be05b0c04', b:'9cf5dfabea8d73540cf75f517674c52d' };
var awsParams = null;
var awsVersion = null;
var maxCount = 10;
var desiredRatio = 3.0;
var distance;
var timers;
var updaterRunning = false;
var bWidth;
var bHeight;
var nameFontSize;
var timeFontSize;
var currFontSize;
var timeRowsPerColumn;
var cellPadding;
var showingSummary = false;
var message;

function removeEntryRow(row) {
	var idx = row && row.parentNode && row.parentNode.parentNode ? row.parentNode.parentNode.rowIndex : null;

	if(idx === 0 || idx) {
		document.getElementById('tblEntry').deleteRow(idx);
	}
}

function start() {
	timers = [];

	for(var i = 0; i < maxCount; i++) {
		var txtName = document.getElementById('txtName' + i);
		var txtBackground = document.getElementById('txtBackground' + i);
		var txtForeground = document.getElementById('txtForeground' + i);

		if(txtName && txtName.value) {
			timers.push({
				name: txtName.value,
				background: txtBackground.value,
				foreground: txtForeground.value,
				lapTimes: [],
				lastMillis: null
			});
		}
	}

	document.getElementById('divEntry').style.display = 'none';
	document.getElementById('divContent').style.display = '';

	sizeBoxes();

	if(!updaterRunning) {
		updaterRunning = true;
		setTimeout(updateCurrent, 60);
	}
}

function sizeBoxes() {
	if(showingSummary) {
		return;
	}

	var content = document.getElementById('divContent');
	var width = parseFloat(content.offsetWidth);
	var height = parseFloat(content.offsetHeight);
	var bestCol = 1, bestRow = 1, bestSize = 1, bestOffset = 99999999;
	var boxCount = timers.length + 1;

	var html = new Array();

	for(var col = 1; col <= 4; col++) {
		for (var row = 1; row <= 4; row++) {
			if((col * row) >= boxCount) {
				var boxWidth = width / col;
				var boxHeight = height / row;
				var size = parseInt(boxWidth * boxHeight);
				var ratio = boxWidth / boxHeight;
				var offset = ratio > desiredRatio ? (ratio / desiredRatio) : (desiredRatio / ratio);

				if(size >= bestSize && offset < bestOffset) {
					bestCol = col;
					bestRow = row;
					bestSize = size;
					bestOffset = offset;
				}
			}
		}
	}

	var bXSpace = (width / bestCol);
	var bYSpace = (height / bestRow);

	bWidth = parseInt(bXSpace - 20);
	bHeight = parseInt(bYSpace - 20);
	nameFontSize = bHeight > (bWidth / 4) ? parseInt(bWidth / 4) : bHeight;
	timeFontSize = nameFontSize > 60 ? parseInt(nameFontSize / 5) : 12;
	currFontSize = nameFontSize > 64 ? parseInt(nameFontSize / 4) : 16;
	timeRowsPerColumn = Math.floor((bHeight - (currFontSize + 3)) / (timeFontSize + 6)) - 1;
	cellPadding = Math.ceil(currFontSize / 8);

	for(var row = 1; row <= bestRow; row++) {
		for (var col = 1; col <= bestCol; col++) {
			var idx = (col - 1) + ((row - 1) * bestCol);
			var top = parseInt((row - 1) * bYSpace);
			var left = parseInt((col - 1) * bXSpace);

			if(idx < timers.length) {
				addBox(html, bWidth, bHeight, top, left, idx);
			}
			else if(row == bestRow && col == bestCol) {
				addControlBox(html, bWidth, bHeight, top, left);
			}
		}
	}

	content.innerHTML = html.join('');
}

function addBox(html, width, height, top, left, idx) {
	var timer = timers[idx];
	var nameFontSize = height > (width / 8) ? parseInt(width / 8) : height;
	var timeFontSize = nameFontSize > 60 ? parseInt(nameFontSize / 5) : 12;
	var currFontSize = nameFontSize > 64 ? parseInt(nameFontSize / 4) : 16;

	html.push('<div id="box');
	html.push(idx);
	html.push('" style="position: absolute; overflow: hidden; width:');
	html.push(width);
	html.push('px; height:');
	html.push(height);
	html.push('px; top:');
	html.push(top);
	html.push('px; left:');
	html.push(left);
	html.push('px; color:');
	html.push(timer.foreground);
	html.push('; background-color:');
	html.push(timer.background);
	html.push('" onclick="clickBox(');
	html.push(idx);
	html.push(')"><span id="name');
	html.push(idx);
	html.push('" style="position: absolute; width:');
	html.push(width);
	html.push('px; height:');
	html.push(height);
	html.push('px; top: 0px; left: 0px; text-align: left; font-size: ');
	html.push(nameFontSize);
	html.push('px">');
	html.push(timer.name);
	html.push('</span><span id="times');
	html.push(idx);
	html.push('" style="position: absolute; right:0px; height:');
	html.push(height);
	html.push('px; top: 0px; font-size: ');
	html.push(timeFontSize);
	html.push('px">');
	addLapTimes(html, timer);
	html.push('</span><span id="currentTimer');
	html.push(idx);
	html.push('" style="position: absolute; width:');
	html.push(width);
	html.push('px; height:');
	html.push(currFontSize);
	html.push('px; top:');
	html.push(height - currFontSize);
	html.push('px; left: 0px; text-align: right; font-size: ');
	html.push(currFontSize);
	html.push('px; font-weight: bold"></span></div>');
}

function addControlBox(html, width, height, top, left) {
	html.push('<div id="controlBox" style="position: absolute; overflow: hidden; width:');
	html.push(width);
	html.push('px; height:');
	html.push(height);
	html.push('px; top:');
	html.push(top);
	html.push('px; left:');
	html.push(left);
	html.push('px"><button id="btnStopRestart" onclick="stopOrRestart(); return false;">Stop Timers</button> <button id="btnSummary" onclick="summary(); return false;" disabled>Show Summary</button></div>');
}

function addLapTimes(html, timer) {
	var laps = timer.lapTimes;

	if(laps.length > 1) {
		var cols = Math.ceil(laps.length / timeRowsPerColumn);

		html.push('<table style="border-spacing: 2px; border-collapse: separate"><tr><th style="padding: 1px ');
		html.push(cellPadding);
		html.push('px 1px ');
		html.push(cellPadding);
		html.push('px" colspan="');
		html.push(cols);
		html.push('">Lap Times</th></tr>');

		for(var row = 0; row < timeRowsPerColumn; row++) {
			html.push('<tr>');

			for(var col = 0; col < cols; col++) {
				var idx = 1 + row + (col * timeRowsPerColumn);

				html.push('<td style="padding: 1px ');
				html.push(cellPadding);
				html.push('px 1px ');
				html.push(cellPadding);
				html.push('px">');

				if(idx < laps.length) {
					var last = laps[idx - 1];
					var current = laps[idx];

					addElapsedTime(html, last.getTime(), current.getTime());

				}

				html.push('</td>');
			}

			html.push('</tr>');
		}

		html.push('</table>');
	}
}

function addElapsedTime(html, startMillis, endMillis, showMillis) {
	var elapsedMillis = endMillis - startMillis;
	var eMillis = elapsedMillis % 1000;
	var eSecs = Math.floor(elapsedMillis / 1000) % 60 + (showMillis || eMillis < 500 ? 0 : 1);
	var eMins = Math.floor(elapsedMillis / 60000) % 60;
	var eHrs = Math.floor(elapsedMillis / 3600000) % 24;
	var eDays = Math.floor(elapsedMillis / 86400000);

	if(eDays > 0) {
		html.push(eDays);
		html.push(' ');
	}
	if(eHrs > 0) {
		if(eHrs < 10) {
			html.push('0');
		}
		html.push(eHrs);
		html.push(':');
	}

	if(eMins < 10) {
		html.push('0');
	}
	html.push(eMins);
	html.push(':');

	if(eSecs < 10) {
		html.push('0');
	}
	html.push(eSecs);

	if(showMillis) {
		html.push('.');
		if(eMillis < 10) {
			html.push('00');
		}
		else if(eMillis < 100) {
			html.push('0');
		}
		html.push(eMillis);
	}
}

function clickBox(idx) {
	if(updaterRunning) {
		var timer = timers[idx];
		var now = new Date();
		timer.lapTimes.push(now);
		timer.lastMillis = now.getTime();

		var html = new Array();
		addLapTimes(html, timer);

		document.getElementById('times' + idx).innerHTML = html.join('');
	}
}

function updateCurrent() {
	try
	{
		var now = (new Date()).getTime();

		for(var i = 0; i < timers.length; i++) {
			var timer = timers[i];
			var elem = document.getElementById('currentTimer' + i);

			if(elem && updaterRunning && timer && timer.lastMillis) {
				var html = new Array();
				addElapsedTime(html, timer.lastMillis, now, true);
				elem.innerHTML = html.join('');
			}
			else if(elem && !updaterRunning) {
				elem.innerHTML = '';
			}
		}
	}
	finally
	{
		if(updaterRunning) {
			setTimeout(updateCurrent, 60);
		}
	}
}

function stopOrRestart() {
	var btnSR = document.getElementById('btnStopRestart');
	var btnSm = document.getElementById('btnSummary');

	if(updaterRunning) {
		updaterRunning = false;
		btnSR.innerHTML = "Restart Timers";
		btnSm.disabled = false;
	}
	else {
		btnSR.innerHTML = "Stop Timers";
		btnSm.disabled = true;

		updaterRunning = true;
		setTimeout(updateCurrent, 60);
	}
}

function summary() {
	var html = new Array(), msg = new Array();
	var now = new Date;
	var date = (now.getFullYear() * 10000) + ((now.getMonth() + 1) * 100) + now.getDate();
	var distance = document.getElementById('txtLap').value;

	showingSummary = true;

	html.push('<div>');
	if(localStorage) {
		try {
			var ver = localStorage.getItem('LapTimes:awsVersion');
			var accessKey = localStorage.getItem('LapTimes:accessKey');
			var secretKey = localStorage.getItem('LapTimes:secretKey');

			if(ver == getAwsVersion()) {
				awsParams = { accessKey: accessKey, secretKey: secretKey };
			}
		}
		catch(e) {
		}
	}

	if(awsParams === null) {
		html.push('<div>Passphrase: <input id="txtPassphrase" type="password" /></div><div>IV Phrase: <input id="txtIVPhrase" type="password" /></div>');
	}

	html.push('<button id="btnSubmit" onclick="this.disabled = true; submitMessage(); return false;">Submit</button></div><span style="white-space: pre">');
	for(var i = 0; i < timers.length; i++) {
		var timer = timers[i];

		if(timer && timer.lapTimes && timer.lapTimes.length > 1) {
			var last = timer.lapTimes[0];

			for(var l = 1; l < timer.lapTimes.length; l++) {
				var current = timer.lapTimes[l];
				var duration = current.getTime() - last.getTime();
				var durMillis = duration % 1000;
				var durSecs = Math.floor(duration / 1000);

				msg.push('{"user":"');
				msg.push(timer.name);
				msg.push('","lapNumber":');
				msg.push(l);
				msg.push(',"date":');
				msg.push(date);
				msg.push(',"durationSeconds":');
				msg.push(durSecs);
				msg.push(',"durationMillis":');
				msg.push(durMillis);
				msg.push(',"distanceFeet":');
				msg.push(distance);
				msg.push('}\n');

				last = current;
			}
		}
	}

	html.push(message = msg.join(''));
	html.push('</span>');

	document.getElementById('divContent').innerHTML = html.join('');
}

function submitMessage() {
	try
	{
		if(awsParams === null) {
			var txtPassphrase = document.getElementById('txtPassphrase').value;
			var txtIVPhrase = document.getElementById('txtIVPhrase').value;

			var key = CryptoJS.SHA3(txtPassphrase, { outputLength: 256 });
			var iv = CryptoJS.SHA3(txtIVPhrase, { outputLength: 256 });

			awsParams = {
				accessKey: decryptText(accessKeyParams, key, iv),
				secretKey: decryptText(secretKeyParams, key, iv)
			};

			if(localStorage) {
				try {
					localStorage.setItem('LapTimes:awsVersion', getAwsVersion());
					localStorage.setItem('LapTimes:accessKey', awsParams.accessKey);
					localStorage.setItem('LapTimes:secretKey', awsParams.secretKey);
				}
				catch(e) {
				}
			}
		}

		sendAwsRequest(publishQueue,
			'SendMessage',
			{ payload: { MessageBody: message }, async: false, accessKey: awsParams.accessKey, secretKey: awsParams.secretKey },
			function() { alert('Message sent successfully'); },
			function() { alert('Message could not be sent'); document.getElementById('btnSubmit').disabled = false; });
	}
	catch(e)
	{
		alert('Unable to send message\n' + e);
		document.getElementById('btnSubmit').disabled = false;
	}
}

function getAwsVersion() {
	if(awsVersion === null) {
		var key = accessKeyParams.a + 'x' + accessKeyParams.b + 'y' + secretKeyParams.a + 'z' + secretKeyParams.b;
		var hash = CryptoJS.SHA3(key);
		awsVersion = CryptoJS.enc.Hex.stringify(hash);
	}

	return awsVersion;
}

function decryptText(params, key, iv) {
	var ciphertext = CryptoJS.enc.Hex.parse(params.a);
	var salt = CryptoJS.enc.Hex.parse(params.b);
	var decryptParams = CryptoJS.lib.CipherParams.create({ ciphertext: ciphertext, iv: iv, salt: salt });
	var decrypted = CryptoJS.AES.decrypt(decryptParams, key, { iv: iv, salt: salt });
	return CryptoJS.enc.Utf8.stringify(decrypted);
}

window.onresize = sizeBoxes;
window.AwsOptions = {};

AwsOptions.region = 'us-west-2';
AwsOptions.service = 'sqs';