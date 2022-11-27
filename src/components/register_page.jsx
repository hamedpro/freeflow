import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { new_user } from "../../api/client";
import { LinkLikeP } from "./link_like_p";

export const RegisterPage = ({}) => {
	var nav = useNavigate();
	var [terms_are_accepted, set_terms_are_accepted] = useState(false);
	var [input_value, set_input_value] = useState(null);
	var [kind_of_input, set_kind_of_input] = useState(null);

	async function register() {
		if (!terms_are_accepted) {
			alert("in order to use our services you have to agree with our terms of use");
			return;
		}
		
		if (!input_value) {
			alert("input value is not acceptable");
			return;
		}
		try {
			var tmp = {};
			tmp[kind_of_input] = input_value;
			var id_of_new_user = await new_user({body : tmp});
			alert("all done. navigating to verification page ...");
			nav(
				`/users/${id_of_new_user}/verification?next_page=complete_register&user_id=${id_of_new_user}&kind_of_input=${kind_of_input}`
			);
		} catch (error) {
			//todo
			console.error(error);
			alert(
				"something went wrong in progress of asking the server to add a new user (see details in console)"
			);
		}
	}
	return (
		<>
			<h1>registeing new user</h1>
			<div className="px-2">
				{kind_of_input === null ? (
					<>
						<p>select one of these options below </p>
						{["email_address", "mobile", "username"].map((option, index) => {
							return (
								<button key={index} onClick={() => set_kind_of_input(option)}>
									{option}
								</button>
							);
						})}
					</>
				) : (
					<>
						<input
							onChange={(event) => {
								set_input_value(event.target.value);
							}}
							className="border border-blue-400 rounded px-1"
						/>
					</>
				)}

				<div
					onClick={() =>
						set_terms_are_accepted((terms_are_accepted) => !terms_are_accepted)
					}
					className="flex items-center space-x-1 mt-2"
				>
					{terms_are_accepted ? <CheckBox /> : <CheckBoxOutlineBlank />}i accept{" "}
					<LinkLikeP link="/terms" className="inline-block">
						terms of use
					</LinkLikeP>
					.
				</div>

				<button
					className="border border-blue-400 rounded block mt-2 px-2 py-1 hover:text-white hover:bg-blue-600 duration-300"
					onClick={register}
				>
					register new user
				</button>
			</div>
		</>
	);
};
