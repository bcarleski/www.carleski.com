angular.module('fheApp', []).controller('fheController', function FHEController ($scope) {
	var self = this;
	var people = [
		{"name":"Dad","class":"dad"},
		{"name":"Robert","class":"robert"},
		{"name":"George","class":"george"},
		{"name":"Calvin","class":"calvin"},
		{"name":"Ben","class":"benny"},
		{"name":"Kristopher","class":"kristopher"},
		{"name":"Phineas","class":"phineas"},
		{"name":"Caroline","class":"caroline"}
	];

	var fhe = [
		{	"title":"Opening Song",
			"class":"opening-song",
		},
		{	"title":"Opening Prayer",
			"class":"opening-prayer",
		},
		{	"title":"Lesson",
			"class":"lesson",
		},
		{	"title":"Activity",
			"class":"activity",
		},
		{	"title":"Spiritual Experience",
			"class":"spiritual-experience",
		},
		{	"title":"Closing Song",
			"class":"closing-song",
		},
		{	"title":"Closing Prayer",
			"class":"closing-prayer",
		},
		{	"title":"Treats",
			"class":"treats",
		}
	];
	
	var addPersonToFHE = function (fheMapEntry, person, fixed) {
		if (fixed) fheMapEntry.fixed = true;
		
		var pc = fheMapEntry.personFHE;
		pc.people.push(person);
	};
	
	var map = {};
	var personFHE = [];

	for (var i = 0; i < fhe.length; i++) {
		var fhePerson = { fhe: fhe[i], key: "" + i, people: [] };
		map[fhe[i].title] = { personFHE: fhePerson };
		personFHE.push(fhePerson);
	}

	var rotatingPeople = [];
	for (var i = 0; i < people.length; i++) {
		var cmap = map[people[i].fixedFHE];

		if (cmap) {
			addPersonToFHE(cmap, people[i], true);
		} else {
			rotatingPeople.push(people[i]);
		}
	}

	const dayInMillis = 24 * 60 * 60 * 1000;
	self.asOfDate = new Date();
	if (/^\?date=[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/.test(location.search))
	{
		self.asOfDate = new Date(location.search.substring(6));
	}
	else
	{
		self.asOfDate = new Date(self.asOfDate.getFullYear(), self.asOfDate.getMonth(), self.asOfDate.getDate());
	}
	
	self.fromDate = new Date(self.asOfDate.valueOf() - (self.asOfDate.getDay() > 0 ? ((self.asOfDate.getDay() - 1) * dayInMillis) : (6 * dayInMillis)));
	self.toDate = new Date(self.fromDate.valueOf() + (6 * dayInMillis));
	self.prevDate = new Date(self.fromDate.valueOf() - (7 * dayInMillis));
	self.nextDate = new Date(self.fromDate.valueOf() + (7 * dayInMillis));

	var startDate = new Date(2018, 6, 30);
	var offset = Math.floor((self.fromDate.valueOf() - startDate.valueOf()) / (7 * dayInMillis));

	for (var i = 0; i < rotatingPeople.length; i++) {
		var pIdx = (i + offset) % rotatingPeople.length;
		var cIdx = i % personFHE.length;
		while (map[fhe[cIdx].title].fixed) { cIdx = (cIdx + 1) % personFHE.length; } 

		addPersonToFHE(map[fhe[cIdx].title], rotatingPeople[pIdx]);
	}

	self.personFHE = personFHE;
});
