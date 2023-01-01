import { PersonRounded } from "@mui/icons-material";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { get_collection, modify_collaborator_access_level, update_document } from "../../api/client";
import { Section } from "./section.jsx";
import Select from "react-select"
function OptionsSection({collaborators,id,context,get_data_function}) {
    var [all_users, set_all_users] = useState(null)
    var [selected_collaborators, set_selected_collaborators] = useState(null)
    async function get_data() {
        set_all_users(await get_collection({ collection_name: "users", filters: {} }))
        get_data_function()
    }
    useEffect(() => {
        get_data()
       },[])
    async function add_new_collaborators() {
        await update_document({
            collection: context,
            update_filter: {
                _id : id 
            },
            update_set: {
                collaborators : [...collaborators.map(i=>{return {user_id : i.user_id,access_level : i.access_level}}),...selected_collaborators.map(i=>{return {user_id : i.value,access_level : 1}})]
            }
        })
        alert('all done!')
        get_data()
    }

    if (all_users === null) return <h1>loading all_users...</h1>
    return (
        <><Section title="options">
            <Select
                onChange={set_selected_collaborators}
                value={selected_collaborators}
                options={[
                    ...all_users.filter(user => !collaborators.map(i => i.user_id).includes(user._id)).map((user) => {
                        return {
                            value: user._id,
                            label: `@${user.username}`,
                        };
                    }),
                ]}
                isMulti
                isSearchable />
        </Section><button onClick={add_new_collaborators}>add these new collaborators</button></>
    )
}
export const CollaboratorsManagementBox = ({ context, id }) => {
	//for example if you want to show collaborators of a workspace with id "blah" : context : "workspaces" , id : "blah"
	var [collaborators, set_collaborators] = useState(null);
	async function get_data() {
		var all_users = await get_collection({ collection_name: "users", filters: {} });
		set_collaborators(
			(await get_collection({ collection_name: context, filters: { _id: id } }))[0][
				"collaborators"
			].map((collaborator) => {
				return {
					...collaborator,
					user_document: all_users.find((user) => user._id === collaborator.user_id),
				};
			})
		);
	}
	async function remove_collaborator_handler(collaborator_id) {
		if (!window.confirm("are you sure?")) return;
		await update_document({
			collection: context,
			update_filter: {
				_id: id,
			},
			update_set: {
				collaborators: (
					await get_collection({ collection_name: context, filters: { _id: id } })
				)[0]["collaborators"].filter((i) => i.user_id !== collaborator_id),
			},
		});
		alert("done!");
		get_data();
	}
	async function change_user_access_level(collaborator, mode) {
		//mode === 1 : upgrade access level of that collaborator by 1
		//mode === -1 : downgrade access level of that collaborator by 1
		if (!window.confirm("are you sure ?!")) return;
        if (collaborator.access_level + mode === 3) {
            if (!window.confirm('now you are owner but if you do this action you become an admin and this user with be owner. do you want to continue ? ')) {
                return 
            } else {
                await modify_collaborator_access_level({ context, id, user_id: localStorage.getItem('user_id'), new_access_level: 2 })
                alert('your access level was changed to 2 ("admin").')
            }
        }
		try {
           await  modify_collaborator_access_level({context,id,user_id : collaborator.user_id,new_access_level :collaborator.access_level + mode  })
			alert("all done!");
		} catch (error) {
			alert("something went wrong! details in console");
			console.log(error);
		}
		get_data();
	}
	useEffect(() => {
		get_data();
	}, []);
	if (collaborators === null) return <h1>loading collaborators...</h1>;
	return (
		<Section title="Collaborators Management Box">
            <Section title="current collaborators">
            {collaborators.map((collaborator, index) => {
				var logged_in_user = collaborators.find(
					(coll) => coll.user_id === window.localStorage.getItem("user_id")
				);
				return (
					<div
						key={index}
						className="h-16 flex items-center space-x-4 flex-1 overflow-scroll"
					>
						<h1>#{index + 1}</h1>
						{collaborator.user_document.profile_image ? (
							<img
								className="h-14 w-14 rounded-full"
								src={`${window.API_ENDPOINT}/profile_images/${collaborator.user_document.profile_image}`}
							/>
						) : (
							<PersonRounded className="h-14 w-14 bg-white" />
						)}
						<p>
							username :{" "}
							{collaborator.user_document.username ? (
								<Link to={`/users/${collaborator.user_id}`}>
									@{collaborator.user_document.username}
								</Link>
							) : (
								<p>undefined</p>
							)}
						</p>
						<p>
							privilege level :{" "}
							{collaborator.access_level === 3
								? "owner"
								: collaborator.access_level === 2
								? "admin"
								: "normal user"}
						</p>
						{logged_in_user.access_level > collaborator.access_level ? (
							<>
								<button
									onClick={() =>
										remove_collaborator_handler(collaborator.user_id)
									}
								>
									remove collaborator
								</button>
								<button onClick={() => change_user_access_level(collaborator, 1)}>
									{collaborator.access_level === 1 ? "make user admin" : null}
									{collaborator.access_level === 2 ? "make user owner" : null}
								</button>
								{collaborator.access_level !== 1 ? (
									<button
										onClick={() => change_user_access_level(collaborator, -1)}
									>
										{collaborator.access_level === 2
											? "make user normal user"
											: null}
									</button>
								) : null}
							</>
						) : null}
					</div>
				);
            })}
            </Section>
            <OptionsSection collaborators={collaborators} context={context} id={id} get_data_function={ get_data} /> 
		</Section>
	);
};
