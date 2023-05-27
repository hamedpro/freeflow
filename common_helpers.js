export function is_there_any_conflict({ start, end, items }) {
	//what it does : it checks whether there is any conflicts between that range and any of those items or not
	//items is an array of items that contain start_date and end_date (both are unix timestamps)
	//range is an object of 2 unix timestamps : {start : number,end : number}
	//todo instead of working on items, deep clone it first and work on that becuse may that change while filtering
	return (
		/* todo make sure about this function 
		(conflict_situations are completely tested) */
		/* note if end of one task or event is equal to 
		start of the next one we do not consider it as a conflict 
		(todo make sure this rule is respected everywhere)*/
		items.filter((item) => {
			var item_start = item.start_date;
			var item_end = item.end_date;
			var possible_conflicts = [
				/* 	these are situations that if an
					item has we undertand that it has
					conflict with that range
					first item of each of these is related to start_date of item
					and second item is related to end_date of item
					so ["before", "in"] means start_date of item is smaller than start of range
					and also that "in" means (range_start < end_date < range_end) 

					** help understanding :
					each range is imagined like this : before---start---in---end---after
				  	and each item_start or item_end is either in one of these 5 places
				*/
				{
					situation: ["before", "in"],
					bool: item_start < start && start < item_end && item_end < end,
				},
				{ situation: ["before", "end"], bool: item_start < start && item_end === end },
				{ situation: ["before", "after"], bool: item_start < start && item_end > end },
				{
					situation: ["start", "in"],
					bool: item_start === start && start < item_end && item_end < end,
				},
				{ situation: ["start", "end"], bool: item_start === start && item_end === end },
				{ situation: ["start", "after"], bool: item_start === start && item_end > end },
				{
					situation: ["in", "in"],
					bool:
						start < item_start &&
						item_start < end &&
						start < item_end &&
						item_end < end,
				},
				{
					situation: ["in", "end"],
					bool: start < item_start && item_start < end && item_end === end,
				},
				{
					situation: ["in", "after"],
					bool: start < item_start && item_start < end && item_end > end,
				},
			];
			var conflicts = possible_conflicts.filter((i) => i.bool);
			if (conflicts.length !== 0) {
				//console.log(JSON.stringify({ item, situation: conflicts.map(i => i.situation) }))
				return true;
			} else {
				return false;
			}
		}).length !== 0
	);
}

export function toHHMMSS(seconds) {
	var sec_num = parseInt(seconds, 10);
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - hours * 3600) / 60);
	var seconds = sec_num - hours * 3600 - minutes * 60;

	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	return {
		hours,
		minutes,
		seconds,
	};
}
export function trim_text_if_its_long(string, max_length) {
	var tmp = string.split("");
	if (tmp.length > max_length) {
		var tmp2 = tmp.slice(0, max_length);
		tmp2.push("...");
		return tmp2.join("");
	} else {
		return tmp.join("");
	}
}
export function clone_simple_object(object_to_clone) {
	/* as it's obvious from it's name just use this 
	func for objects like {a:"hamed",b:"negin"} */
	var cloned_object = {};
	Object.keys(object_to_clone).forEach((key) => {
		cloned_object[key] = object_to_clone[key];
	});
	return cloned_object;
}
export function multi_lang_helper({ en, fa }) {
	var lang = window.localStorage.getItem("language");
	if (lang === null) {
		return fa; //defalt lang is set here
		//todo get default lang from user in the first setup page
	}
	return lang === "fa" ? fa : en;
}

//todo do detecting if access is denied or not server side
export function shuffle(array) {
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}
export function gen_link_to_file(relative_file_path) {
	/* we serve ./uploaded directory on same port as api 
		but when frontend wants to access an image the link 
		it should use depends on where its running in 
		for example if the frontend is in the same machine with api 
		it should connect to localhost but if its on a network it should
		connect to machine which api is running on using its local or public ip
	*/
	// relative_file_path is relative with ./uploaded directory
	return new URL(relative_file_path, window.api_endpoint).href;
}
export function custom_range({ from = 0, to }) {
	var result = [];
	for (let i = from; i <= to; i++) {
		result.push(i);
	}
	return result;
}
export function get_start_and_end(timestamp, mode = "day") {
	//timestamp := result of Date.getTime()
	//what mode does : if mode = day it will smaller details than day like hours and minutes and ...
	//but if its set to year it will return the exact start point of that year
	var d = new Date(timestamp);
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	if (mode === "month") {
		d.setDate(1);
		if (mode === "year") {
			d.setMonth(0);
		}
	}
	d = d.getTime();
	return {
		start: d,
		end: d + 3600 * 1000 * 24,
	};
}
export var month_names = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
].map((i) => i.toLowerCase());
export var day_names = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
].map((i) => i.toLowerCase());

export function get_months_days_count(year) {
	return [31, year % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
}
export function timestamp_filled_range({ start, end, items }) {
	//items must be an array of tasks or events
	//start and end must be unix timestamps
	//result items are like one of these :
	// 1- {start_percent , end_percent , ...task}
	// 2- empty spaces are like this : {start_percent , end_percent , end_date , start_date ,value : null }

	//it cuts every part outside its range to fit items inside itself

	let result = JSON.parse(JSON.stringify(items));
	result = result
		.sort((i1, i2) => i1.start_date - i2.start_date)
		.filter((i) => is_there_any_conflict({ items: [i], start, end }));
	if (result.length === 0) {
		result = [
			{ value: null, start_date: start, end_date: end, start_percent: 0, end_percent: 100 },
		];
		return result;
	}
	if (result[0].start_date !== start) {
		if (result[0].start_date < start) {
			result[0].start_date = start;
		} else {
			result.unshift({ value: null, start_date: start, end_date: result[0].start_date });
		}
	}
	if (result.at(-1).end_date !== end) {
		if (result.at(-1).end_date > end) {
			result.at(-1).end_date = end;
		} else {
			result.push({
				value: null,
				start_date: result.at(-1).end_date,
				end_date: end,
			});
		}
	}
	while (true) {
		let index_to_fill = null;
		for (let i = 1; i <= result.length - 1; i++) {
			if (result[i - 1].end_date !== result[i].start_date) {
				index_to_fill = i;
				break;
			}
		}
		if (index_to_fill === null) {
			break;
		} else {
			result.splice(index_to_fill, 0, {
				value: null,
				start_date: result[index_to_fill - 1].end_date,
				end_date: result[index_to_fill].start_date,
			});
		}
	}
	//adding percents for start and end dates
	result = result.map((item) => {
		return {
			...item,
			start_percent: ((item.start_date - start) / (end - start)) * 100,
			end_percent: ((item.end_date - start) / (end - start)) * 100,
		};
	});
	return result;
}
export function sum_array(array) {
	var total = 0;
	array.forEach((number) => {
		total += number;
	});
	return total;
}
export var check_being_collaborator = (item, user_id) =>
	item.collaborators.map((collaborator) => collaborator.user_id).includes(user_id);

export var unique_items_of_array = (
	array //todo : it may not work for array containing anything other than numbers or string
) => array.filter((i, index) => array.indexOf(i) === index);

export var custom_find_unique = (array, custom_compare_function) => {
	//custom_compare_function is a function which accepts 2 items and returns true if they are the same (otherwise returns false)
	var cloned_array = [...array];
	function find_duplicate_pairs() {
		var all_pairs = [];
		for (var i = 0; i < cloned_array.length; i++) {
			for (var j = 0; j < cloned_array.length; j++) {
				if (j !== i) {
					all_pairs.push([i, j]);
				}
			}
		}
		return all_pairs.filter(
			(pair) => custom_compare_function(cloned_array[pair[0]], cloned_array[pair[1]]) === true
		);
		//returns an array like this : [[1,2] , [5,3]] ->
		//it means in index 1 and index 2 of cloned array are the same according to custom_compare_function
		//and the same is true about cloned_array[5] and cloned_array[3]
	}
	while (find_duplicate_pairs().length !== 0) {
		cloned_array.splice(find_duplicate_pairs()[0][1], 1);
	}
	return cloned_array;
};
export function simple_int_range({ start, end }) {
	//returns an array of integers including both start and end values
	var result = [];
	for (var i = start; i <= end; i++) {
		result.push(i);
	}
	return result;
}
export function simple_find_duplicates(...arrays) {
	//accepts 2 or more arrays and returns items which all of them have in common
	if (arrays.length < 2) throw new Error("at least 2 arrays must be passed");

	if (arrays.length === 2) {
		var results = [];
		arrays[0].forEach((item) => {
			if (arrays[1].includes(item)) {
				results.push(item);
			}
		});
		return results;
	} else {
		return simple_find_duplicates(
			simple_find_duplicates(...arrays.slice(0, arrays.length - 1)),
			arrays.at(-1)
		);
	}
}
export function makeid(length) {
	let result = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}
export function gen_thing_link(surface_cache, thing_id) {
	//for example you wanna that absolute link
	//which point to a unit/pack with thing_id = 2
	var thing_type = surface_cache.find((i) => i.thing_id === thing_id).thing.type;
	if (!thing_type.startsWith("unit/") && !thing_type === "user") {
		throw new Error("we couldnt generate thing link for this thing_id");
	} else {
		if (thing_type.startsWith("unit/")) {
			return `/dashboard/${thing_type.split("/")[1] + "s"}/${thing_id}`;
		} else {
			return `/dashboard/users/${thing_id}`;
		}
	}
}
export function find_unit_parents(surface_cache, thing_id) {
	var parents = []; // it is sorted from nearest parent to farthest
	var search_cursor = thing_id;
	while (
		(search_cursor = surface_cache.find((i) => i.thing_id === search_cursor).thing.value
			.pack_id)
	) {
		parents.push(search_cursor);
	}
	return parents;
}
export function slice_object(object, ...fields) {
	var tmp = {};
	fields.forEach((field) => (tmp[field] = object[field]));
	return tmp;
}
export function calc_discoverable_pack_chains(surface_cache) {
	return custom_find_unique(
		surface_cache
			.filter((i) => i.thing.type === "unit/pack")
			.map((i) => {
				var chain = [i.thing_id];
				var tmp;
				while (
					(tmp = surface_cache.find((i) => i.thing.value.pack_id === i.thing_id)?.pack_id)
				) {
					chain.push(tmp);
				}
				return chain;
			}),
		(array1, array2) => {
			if (array1.length !== array2.length) {
				return false;
			}
			for (var i = 0; i < array1.length; i++) {
				if (array1[i] !== array2[i]) {
					return false;
				}
			}
			return true;
		}
	);
}
