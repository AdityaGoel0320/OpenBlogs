import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Context } from "../../main";
import { BackendUrl } from "../../assets/FrontendUtils";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";
import StudioLayout from "../layout/StudioLayout";
import StoryEditor from "../miniComponents/StoryEditor";

export default function UpdateBlog() {
  const { id } = useParams();
  const { user, isAuthenticated, setBlogs } = useContext(Context);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated || user.role !== "Author") return;
    let active = true;
    setLoading(true);
    setError("");
    async function load() {
      try {
        const { data } = await axios.get(`${BackendUrl}/api/v1/blog/singleblog/${id}`, { withCredentials: true });
        if (String(data.blog.createdBy) !== String(user._id)) throw new Error("You can only edit stories from your own workspace.");
        if (active) setBlog(data.blog);
      } catch (err) {
        if (active) setError(err.message === "You can only edit stories from your own workspace." ? err.message : getApiErrorMessage(err, "We couldn't open this story."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id, isAuthenticated, user._id, user.role, attempt]);
  function onSaved(saved) {
    setBlogs((current) => {
      const remaining = current.filter((item) => item._id !== saved._id);
      return saved.published ? [...remaining, saved] : remaining;
    });
    navigate("/dashboard?tab=stories");
  }
  return <StudioLayout active="edit" hasUnsavedChanges={hasUnsavedChanges}>{loading ? <div className="studio-loading" role="status">Opening your story...</div> : error ? <div className="studio-empty" role="alert"><h1>Unable to open story</h1><p>{error}</p><button className="studio-button" onClick={() => setAttempt((value) => value + 1)}>Try again</button><Link className="text-link" to="/dashboard?tab=stories">Back to stories</Link></div> : <StoryEditor key={blog._id} blog={blog} onSaved={onSaved} onDirtyChange={setHasUnsavedChanges} />}</StudioLayout>;
}
