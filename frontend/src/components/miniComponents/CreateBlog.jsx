import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import StoryEditor from "./StoryEditor";

export default function CreateBlog({ onSaved, onDirtyChange }) {
  const navigate = useNavigate();
  return <StoryEditor onDirtyChange={onDirtyChange} onSaved={(blog) => { onSaved(blog); navigate("/dashboard?tab=stories"); }} />;
}
CreateBlog.propTypes = { onSaved: PropTypes.func.isRequired, onDirtyChange: PropTypes.func };
