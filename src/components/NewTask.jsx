import { useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TextField } from "@mui/material";
//import AdapterMoment from "@date-io/jalaali";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import Select from "react-select";

import { StyledDiv } from "./styled_elements";
import { NewCalendarCategorySection } from "./NewCalendarCategorySection";
import { UnifiedHandlerClientContext } from "../UnifiedHandlerClientContext";
import { PrivilegesEditor } from "./PrivilegesEditor";
import { sum_array } from "../../common_helpers";
import { CreateMore } from "./CreateMore";
//TODO: component re-renders
export const NewTask = () => {
	var [create_more, set_create_more] = useState();

	var { cache } = useContext(UnifiedHandlerClientContext);
	var nav = useNavigate();
	var [privileges, set_privileges] = useState();
	var [search_params, set_search_params] = useSearchParams();
	var [selected_parent_pack, set_selected_parent_pack] = useState(() => {
		var pack_id = Number(search_params.get("pack_id"));
		if (pack_id) {
			let tmp = cache.find((i) => i.thing_id === pack_id);
			return {
				value: tmp.thing_id,
				label: tmp.thing.value.title,
			};
		} else {
			return { value: null, label: "without a parent pack" };
		}
	});
	function select_parent_pack(value) {
		set_selected_parent_pack(value);
		set_search_params((prev) => {
			var t = {};
			for (var key of prev.keys()) {
				t[key] = prev.get(key);
				// todo it doesnt cover when there is
				//more than a single value with that key
			}
			return { ...t, pack_id: value.value };
		});
	}
	const [title_input, set_title_input] = useState("");
	var [steps, set_steps] = useState([]);
	const [description_input, set_description_input] = useState("");
	//TODO: check _locale for possible option to output the _d(date) object in jalaali's format
	const [selected_dates, set_selected_dates] = useState({
		end: null,
		start: null,
	});
	function add_new_step() {
		var title = prompt("enter its title");
		var description = prompt("enter its description");
		var percent = prompt("enter its percent");
		if (!percent || isNaN(Number(percent)) || Number(percent) > 100 || Number(percent) < 0) {
			alert("percent must be a number between 0-100");
			return;
		}
		set_steps((prev) => [
			...prev,
			{ title, description, percent: Number(percent), is_done: false },
		]);
	}
	async function submit_new_task() {
		if (steps.length === 0) {
			alert("there must be at least a single step defined");
			return;
		}

		if (sum_array(steps.map((i) => i.percent)) !== 100) {
			alert("sum of percent of steps must be equal to 100");
			return;
		}
		if (!selected_calendar_category) {
			alert("you must choose a calendar category for this");
			return;
		}
		try {
			var new_task_id = await uhc.request_new_transaction({
				new_thing_creator: () => ({
					type: "unit/task",
					value: {
						end_date: selected_dates.end,
						start_date: selected_dates.start,
						title: title_input,
						description: description_input,
						category_id: selected_calendar_category.value,
						steps,
					},
				}),
				thing_id: undefined,
			});

			var new_meta_id = await uhc.request_new_transaction({
				new_thing_creator: () => ({
					type: "meta",
					value: {
						thing_privileges: privileges,
						modify_thing_privileges: uhc.user_id,
						locks: [],
						pack_id: selected_parent_pack.value,
						thing_id: new_task_id,
					},
				}),
				thing_id: undefined,
			});
			alert("all done!");
			if (!create_more) {
				nav(`/dashboard/${new_task_id}`);
			}
		} catch (error) {
			console.log(error);
			alert("something went wrong. details in console");
		}
	}
	var [selected_calendar_category, select_calendar_category] = useState(null);
	return (
		<div className="p-2">
			<h1>NewTask</h1>
			<h2 className="mt-2">enter a title for this task : </h2>
			<input className="px-1 rounded" onChange={(ev) => set_title_input(ev.target.value)} />
			<h2 className="mt-2">enter a description for this task : </h2>
			<textarea
				className="px-1 rounded"
				onChange={(ev) => set_description_input(ev.target.value)}
				rows={5}
			/>
			<table>
				<thead>
					<tr>
						<th>title</th>
						<th>description</th>
						<th>percent</th>
					</tr>
				</thead>
				<tbody>
					{steps.map((step, index) => (
						<tr key={index}>
							<td>{step.title}</td>
							<td>{step.description}</td>
							<td>{step.percent}</td>
						</tr>
					))}
				</tbody>
			</table>
			<button onClick={add_new_step}>add new step</button>
			<h2 className="mt-2">select an existing calendar category or create a new one</h2>
			<p>(if what you want was not in existing categories create it now in section below)</p>
			<Select
				onChange={select_calendar_category}
				value={selected_calendar_category}
				options={[
					...cache
						.filter((i) => i.thing.type === "calendar_category")
						.map((i) => {
							return {
								value: i.thing_id,
								label: `${i.thing.value.name} (${i.thing.value.color})`,
							};
						}),
				]}
				isSearchable
			/>
			<NewCalendarCategorySection />

			<h2 className="mt-2">select 'start' and 'end' dates for this task : </h2>
			{["start", "end"].map((type, index) => {
				return (
					<div key={index} className="mb-3 block">
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DateTimePicker
								renderInput={(props) => <TextField {...props} />}
								label={`select task ${type} date`}
								value={selected_dates[type]}
								onChange={(newValue) => {
									set_selected_dates((prev_dates) => {
										var tmp = { ...prev_dates };
										tmp[type] = newValue.$d.getTime();
										return tmp;
									});
								}}
							/>
						</LocalizationProvider>
					</div>
				);
			})}
			<PrivilegesEditor onChange={set_privileges} />
			<h1>select a parent pack for this note if you want :</h1>
			<Select
				onChange={select_parent_pack}
				value={selected_parent_pack}
				options={[
					{ value: null, label: "without a parent pack " },
					...cache
						.filter((i) => i.thing.type === "unit/pack")
						.map((i) => {
							return {
								value: i.thing_id,
								label: i.thing.value.title,
							};
						}),
				]}
				isSearchable
			/>
			<StyledDiv className="w-fit mt-2" onClick={submit_new_task}>
				submit
			</StyledDiv>
			<CreateMore
				onchange={(new_state) => {
					set_create_more(new_state);
				}}
			/>
		</div>
	);
};
