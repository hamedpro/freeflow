import { useEffect } from "react";
import { useState } from "react";
import {
  get_comments,
  new_comment,
  edit_comment,
  delete_comment,
} from "../../api/client";
import Comment from "./Comment";
const CommentSBox = ({ user_id }) => {
	const lastUrlParamKey = Object.keys(urlParams).at(-1);
	const [editId, setEditId] = useState("");
	const [inputComment, setInputComment] = useState("");
	const [comments, setComments] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const inputCommentHandler = (e) => {
		setInputComment(e.target.value);
	};
	const getCommentsHandler = async () => {
		const filters = {
			user_id,
		};
		filters[lastUrlParamKey] = await urlParams[lastUrlParamKey];
		try {
			const loadedCommnets = await get_comments({
				filters,
			});
			setComments(loadedCommnets);
		} catch (error) {
			console.log(error);
		}
	};

	const submitHandler = async (e) => {
		e.preventDefault();
		try {
			if (editId) {
				await edit_comment({ new_text: inputComment, comment_id: editId });
				setEditId("");
				getCommentsHandler();
			} else {
				await new_comment({
					date: new Date().getTime(),
					text: inputComment,
					...urlParams,
				});
				getCommentsHandler();
			}
			setInputComment("");
		} catch (error) {
			console.log(error);
		}
	};

	const deleteHandler = (commentId) => {
		delete_comment({
			filters: {
				user_id,
			},
		});
		getCommentsHandler();
	};

	useEffect(() => {
		const func = async () => {
			await getCommentsHandler();
			setIsLoading(false);
		};
		func();
	}, []);
	//TODO: what happens if client failed to fetch the comments.
	return (
		<div className="comments-box-container">
			{isLoading ? (
				<span>loading...(check network)</span>
			) : (
				comments &&
				comments.map(({ _id, text }) => (
					<Comment
						key={_id}
						commentId={_id}
						text={text}
						setEditId={setEditId}
						deleteHandler={deleteHandler}
					/>
				))
			)}
			<form onSubmit={submitHandler}>
				<input
					placeholder="enter a comment"
					value={inputComment}
					onChange={inputCommentHandler}
					required
				/>
				<button>{editId ? "edit message" : "send message"}</button>
			</form>
		</div>
	);
};

export default CommentSBox;
