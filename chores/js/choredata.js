angular.module('choresApp', []).controller('choresController', function ChoresController ($scope) {
	var self = this;
	var people = [
		{"name":"Ben","class":"benny"},
		{"name":"Calvin","class":"calvin"},
		{"name":"George","class":"george"},
		{"name":"Robert","class":"robert"},
		{"name":"Kristopher","class":"kristopher","fixedChore":"Clean Bedroom"},
		{"name":"Phineas","class":"phineas","fixedChore":"Clean Bedroom"},
		{"name":"Caroline","class":"caroline","fixedChore":"Clean Bedroom"},
		{"name":"EVERYONE","class":"everyone","fixedChore":"Kitchen"}
	];

	var chores = [
		{	"title":"Family Room / Back Hallway",
			"class":"hallways-family-stairs",
			"tasks":[
				{	"title":"Daily",
					"class":"daily",
					"subTasks":[
						"Pick up family room",
						"Sweep and vacuum back hallway",
						"Sweep and vacuum family room",
						"Wipe down TV stand",
						"Dust piano",
						"Pick up library closet",
						"Move couch, clean underneath",
						"Take off cushions, clean underneath"
					]
				},
				{	"title":"Weekly",
					"class":"weekly",
					"subTasks":[
						"Vacuum edges of all walls using wand",
						"Mop back hallway",
						"Wipe down window and TV",
						"Pick up, arrange, and clean library",
						"Wipe down doors in the family room"
					]
				}
			]
		},
		{	"title":"Bathrooms / Laundry",
			"class":"bathrooms",
			"tasks":[
				{	"title":"Daily",
					"class":"daily",
					"subTasks":[
						"Wipe off counter tops",
						"Clean out sink",
						"Clean top of back of toilet",
						"Clean top of toilet seat",
						"Clean underside of the toilet seat",
						"Clean top of bowl under the toilet seat",
						"Clean the base of the toilet",
						"Sweep the floor",
						"Pick up laundry room",
						"Clear off tops of washer/dryer",
						"Clean between washer/dryer and walls",
						"Sweep laundry room floor"
					]
				},
				{	"title":"Tuesday / Thursday / Saturday",
					"class":"tue-thu-sat",
					"subTasks":[
						"Collect all the trash from the kitchen, bathrooms, and parent's room",
						"Take trash to the outside cans"
					]
				},
				{	"title":"Weekly",
					"class":"weekly",
					"subTasks":[
						"Clean mirrors",
						"Scrub out toilet bowl with cleaner and brush",
						"Wipe down cabinet doors",
						"Sweep and mop floors, including under counters",
						"Wipe down walls and both sides of bathroom doors",
						"Mop laundry room floors",
						"Wipe down washer/dryer"
					]
				}
			]
		},
		{	"title":"Living Room / Dining Room",
			"class":"living-dining",
			"tasks":[
				{	"title":"Daily",
					"class":"daily",
					"subTasks":[
						"Sweep and vacuum the living room floor",
						"Sweep and vacuum the dining room floor",
						"Wipe down dining room table and chairs"
					]
				},
				{	"title":"Weekly",
					"class":"weekly",
					"subTasks":[
						"Vacuum edges of all walls using wand",
						"Mop living room floor",
						"Mop dining room floor",
						"Clean window seat",
						"Clean playsets",
						"Move and clean out under couch",
						"Take off couch cushions and vacuum",
						"Clean out under couch cushions",
						"Wipe down front door and sliding glass door"
					]
				}
			]
		},
		{	"title":"Hallways",
			"class":"dishes",
			"tasks":[
				{
					"title":"Daily",
					"class":"daily",
					"subTasks":[
						"Sweep and vacuum the front hallway",
						"Vacuum the staircase",
						"Clean out front closet",
						"Put away everything on hallway bench",
						"Move and sweep under hallway bench",
						"Sweep and vacuum the upstairs hallway",
						"Empty dishwasher as needed"
					]
				},
				{	"title":"Tuesday / Thursday / Saturday",
					"class":"tue-thu-sat",
					"subTasks":[
						"Take all recycling to the outside cans"
					]
				},
				{
					"title":"Weekly",
					"class":"weekly",
					"subTasks":[
						"Vacuum edges of all walls using wand",
						"Move, clean, and vacuum under hallway bench",
						"Mop downstairs hallway floor",
						"Mop upstairs hallway floor",
						"Wipe down walls in stairway",
						"Wipe down front door and sliding glass door"
					]
				}
			]
		},
		{	"title":"Clean Bedroom",
			"class":"pickup-floors",
			"tasks":[
				{	"title":"Daily",
					"class":"daily",
					"subTasks":[
						"Put away all dolls and toys",
						"Put all laundry in drawers or dirty bins",
						"Take all trash to trash can",
						"Make beds"
					]
				}
			]
		},
		{	"title":"Kitchen",
			"class":"kitchen",
			"tasks":[
				{
					"title":"Any Time It Needs It",
					"class":"daily",
					"subTasks":[
						"Rinse ALL dishes so no food is visible",
						"Load a load of dishes into dishwasher",
						"Add detergent, and start dishwasher",
						"Wipe out sink",
						"Wipe down cabinet doors",
						"Clean counters, including under and behind appliances",
						"Wipe down all appliances",
						"Scrub microwave, inside and out",
						"Organize everyone picking up the kitchen"
					]
				}
			]
		}
	];
	
	var addPersonToChore = function (choreMapEntry, person, fixed) {
		if (fixed) choreMapEntry.fixed = true;
		
		var pc = choreMapEntry.personChore;
		pc.people.push(person);
	};
	
	var toggleDetails = function () {
		var details = document.getElementById('taskList' + this.key);
		if (details) {
			if (details.classList.contains('hidden')) {
				details.classList.remove('hidden');
			} else {
				details.classList.add('hidden');
			}
		}
	};

	var map = {};
	var personChores = [];

	for (var i = 0; i < chores.length; i++) {
		var personChore = { chore: chores[i], key: "" + i, toggleDetails: toggleDetails, people: [] };
		map[chores[i].title] = { personChore: personChore };
		personChores.push(personChore);
	}

	var rotatingPeople = [];
	for (var i = 0; i < people.length; i++) {
		var cmap = map[people[i].fixedChore];

		if (cmap) {
			addPersonToChore(cmap, people[i], true);
		} else {
			rotatingPeople.push(people[i]);
		}
	}

	self.asOfDate = new Date();
	if (/^\?date=[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/.test(location.search))
	{
		self.asOfDate = new Date(location.search.substring(6));
	}
	else
	{
		self.asOfDate = new Date(self.asOfDate.getFullYear(), self.asOfDate.getMonth(), self.asOfDate.getDate());
	}
	
	self.fromDate = new Date(self.asOfDate.valueOf() - (self.asOfDate.getDay() * 24 * 60 * 60 * 1000));
	self.toDate = new Date(self.fromDate.valueOf() + (6 * 24 * 60 * 60 * 1000));
	self.prevDate = new Date(self.fromDate.valueOf() - (7 * 24 * 60 * 60 * 1000));
	self.nextDate = new Date(self.fromDate.valueOf() + (7 * 24 * 60 * 60 * 1000));

	var startDate = new Date(2018, 7, 20);
	var offset = Math.floor((self.fromDate.valueOf() - startDate.valueOf()) / (7 * 24 * 60 * 60 * 1000));

	for (var i = 0; i < rotatingPeople.length; i++) {
		var pIdx = (i + offset) % rotatingPeople.length;
		var cIdx = i % personChores.length;
		while (map[chores[cIdx].title].fixed) { cIdx = (cIdx + 1) % personChores.length; } 

		addPersonToChore(map[chores[cIdx].title], rotatingPeople[pIdx]);
	}

	self.personChores = personChores;
});
