import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiBookOpen, FiCheckCircle, FiEdit3, FiFileText, FiLayers } from "react-icons/fi";
import axios from "axios";
import StudioLayout from "../layout/StudioLayout";
import MyBlogs from "../miniComponents/MyBlogs";
import MyProfile from "../miniComponents/MyProfile";
import CreateBlog from "../miniComponents/CreateBlog";
import Chart from "../miniComponents/Chart";
import { Context } from "../../main";
import { BackendUrl } from "../../assets/frontendConstants";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";

export default function Dashboard() {
  const [params] = useSearchParams();
  const tab = ["stories", "create", "analytics", "profile"].includes(params.get("tab")) ? params.get("tab") : "overview";
  const { user, isAuthenticated, setBlogs } = useContext(Context);
  const [myBlogs, setMyBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${BackendUrl}/api/v1/blog/myblogs`, { withCredentials: true });
      setMyBlogs([...data.blogs].reverse());
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't load your stories. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (isAuthenticated && user.role === "Author") fetchBlogs();
  }, [fetchBlogs, isAuthenticated, user.role]);

  function onSaved(blog) {
    setMyBlogs((current) => [blog, ...current]);
    if (blog.published) setBlogs((current) => [blog, ...current]);
  }
  function onDeleted(id) {
    setMyBlogs((current) => current.filter((blog) => blog._id !== id));
    setBlogs((current) => current.filter((blog) => blog._id !== id));
  }
  const published = myBlogs.filter((blog) => blog.published).length;
  const topics = new Set(myBlogs.map((blog) => blog.category)).size;
  const stats = [["Total stories", myBlogs.length, "Your complete library", FiBookOpen], ["Published", published, "Live on OpenBlogs", FiCheckCircle], ["Drafts", myBlogs.length - published, "Ideas in progress", FiFileText], ["Topics explored", topics, "Categories you write about", FiLayers]];
  const needsLibrary = ["overview", "stories", "analytics"].includes(tab);

  return (
    <StudioLayout active={tab} hasUnsavedChanges={hasUnsavedChanges}>
      {tab === "create" ? <CreateBlog onSaved={onSaved} onDirtyChange={setHasUnsavedChanges} /> : tab === "profile" ? <MyProfile /> : <>
        <div className="studio-page-heading"><div><span className="section-kicker">YOUR CREATIVE WORKSPACE</span><h1>{tab === "overview" ? `Welcome back, ${user.name?.split(" ")[0] || "writer"}.` : tab === "stories" ? "Your stories" : "Publishing insights"}</h1><p>{tab === "overview" ? "A little clarity for your next big idea. Here's where your writing stands." : tab === "stories" ? "Every idea, draft, and published story. All in one place." : "A clear picture of your library, built from your actual stories."}</p></div><Link className="studio-button" to="/dashboard?tab=create"><FiEdit3 aria-hidden="true" />Write a story</Link></div>
        {needsLibrary && loading ? <div className="studio-loading" role="status"><span className="studio-spinner" />Loading your stories...</div> : error ? <div className="studio-empty" role="alert"><h2>Unable to load your workspace</h2><p>{error}</p><button className="studio-button" onClick={fetchBlogs}>Try again</button></div> : <>
          <div className="studio-stats">{stats.map(([label, count, note, Icon]) => <article key={label} className="studio-stat"><div><span>{label}</span><Icon aria-hidden="true" /></div><strong>{count}</strong><small>{note}</small></article>)}</div>
          {tab === "analytics" ? <Chart blogs={myBlogs} /> : tab === "stories" ? <MyBlogs blogs={myBlogs} onDeleted={onDeleted} /> : <>
            <section className="studio-welcome"><div><span className="section-kicker">KEEP THE MOMENTUM</span><h2>Your perspective deserves a page.</h2><p>Pick up a draft or start something new. Your next story could be the one someone needs to read.</p><Link to="/dashboard?tab=create" className="studio-button">Start writing <FiArrowRight aria-hidden="true" /></Link></div><div className="studio-writing-art" aria-hidden="true"><FiEdit3 /><span>Make room<br />for your ideas.</span></div></section>
            <div className="studio-section-heading"><div><h2>Your story library</h2><p>Manage your writing, from first draft to published story.</p></div><Link className="text-link" to="/dashboard?tab=stories">View all stories <FiArrowRight aria-hidden="true" /></Link></div>
            <MyBlogs blogs={myBlogs.slice(0, 3)} onDeleted={onDeleted} compact />
          </>}
        </>}
      </>}
    </StudioLayout>
  );
}
