import React, { Fragment, useContext, useEffect } from "react";
import { useState } from "react";
import { useLocation, useMatch, useNavigate, useParams } from "react-router-dom";
import { get_user_data_hierarchy } from "../../api/client";
import { GlobalDataContext } from "../GlobalDataContext";
function Option({ text, indent_count, url }) {
	var nav = useNavigate();
	var is_selected = useMatch(url);
	return (
		<div
			className={[
				"border-t border-b border-black flex  items-center w-full",
				is_selected ? "bg-blue-600 text-white" : "",
			].join(" ")}
			style={{ paddingLeft: indent_count * 20 + "px" }}
			onClick={() => nav(url)}
		>
			{text}
		</div>
	);
}

export const PrimarySideBar = () => {
	var { global_data, get_global_data } = useContext(GlobalDataContext);
	var user_id = localStorage.getItem("user_id");
	var [options, set_options] = useState();
	var loc = useLocation();
	function create_downside_tree(context, id) {
		//possible values for context : packs , tasks , resources , notes
		//it returns an array of options (with correct order and ready to be rendered )

		if (["tasks", "notes", "resources"].includes(context)) {
			return [
				{
					text: `${context
						.split("")
						.slice(0, context.length - 1)
						.join("")} : ${id}`,
					url: `/${context}/${id}`,
				},
			];
		} else if (context === "packs") {
			var tmp = [
				{
					text: `pack ${id}`,
					url: `/dashboard/packs/${id}`,
				},
			];
			tmp.concat(
				global_data.all.tasks
					.filter((task) => task.pack_id === id)
					.map((task) => {
						return {
							text: `task ${task._id}`,
							url: `dashboard/tasks/${task._id}`,
						};
					})
			);
			tmp.concat(
				global_data.all.resources
					.filter((resource) => resource.pack_id === id)
					.map((resource) => {
						return {
							text: `resource ${resource._id}`,
							url: `dashboard/resources/${resource._id}`,
						};
					})
			);
			tmp.concat(
				global_data.all.notes
					.filter((note) => note.pack_id === id)
					.map((note) => {
						return {
							text: `note ${note._id}`,
							url: `dashboard/notes/${note._id}`,
						};
					})
			);
			global_data.all.packs
				.filter((pack) => pack.pack_id === id)
				.forEach((pack) => {
					tmp.concat(create_downside_tree("packs", pack._id));
				});
			return tmp;
		}
	}
	function create_full_tree(context, id) {
		//possible values for context : packs , tasks , resources , notes
		if (global_data.all[context].find((i) => i._id === id).pack_id) {
			var latest_found_parent = global_data.all[context].find((i) => i._id === id).pack_id;
			while (global_data.all.packs.find((pack) => pack._id === latest_found_parent).pack_id) {
				latest_found_parent = global_data.all.packs.find(
					(pack) => pack._id === latest_found_parent
				).pack_id;
			}
			return create_downside_tree("packs", latest_found_parent);
		} else {
			return create_downside_tree(context, id);
		}
	}
	function find_unique_trees(array_of_trees) {
		//returns an array of those trees without any duplicate
		return [];
	}
	async function get_data() {
		var trees = [];
		global_data.user.tasks.forEach((task) => {
			trees.push(create_full_tree("tasks", task._id));
		});

		global_data.user.notes.forEach((note) => {
			trees.push(create_full_tree("notes", note._id));
		});

		global_data.user.resources.forEach((resource) => {
			trees.push(create_full_tree("resources", resource._id));
		});

		global_data.user.packs.forEach((pack) => {
			trees.push(create_full_tree("packs", pack._id));
		});

		set_options(find_unique_trees(trees).flat());
	}
	useEffect(() => {
		get_data();
	}, [loc]);
	if (options == null) {
		return "loading options ...";
	}
	return (
		<>
			{options.map((option, index) => {
				return (
					<Fragment key={index}>
						<Option {...option} />
					</Fragment>
				);
			})}
		</>
	);
};
