import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiArrowUp, FiArrowUpRight, FiEdit3, FiFileText, FiMessageCircle, FiSearch, FiStar, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { BackendUrl } from "../../assets/frontendConstants";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";
import { WriterSelect } from "./WriterElements";
import "../../writers.css";

export default function MyBlogs({ blogs, onDeleted, compact = false }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("order");
  const [engagement, setEngagement] = useState("all");
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  useEffect(() => {
    if (selected) dialog.current.showModal();
  }, [selected]);
  const filtered = blogs.filter((blog) => {
    if (filter !== "all" && (filter === "published" ? !blog.published : blog.published)) return false;
    if (engagement === "upvoted" && !blog.community?.upvoteCount) return false;
    if (engagement === "rated" && !blog.community?.ratingCount) return false;
    if (engagement === "four-stars" && (blog.community?.averageRating || 0) < 4) return false;
    return `${blog.title} ${blog.category}`.toLowerCase().includes(search.toLowerCase());
  }).sort((first, second) => {
    if (sort === "upvotes") return (second.community?.upvoteCount || 0) - (first.community?.upvoteCount || 0);
    if (sort === "stars") return (second.community?.averageRating || 0) - (first.community?.averageRating || 0) || (second.community?.ratingCount || 0) - (first.community?.ratingCount || 0);
    if (sort === "comments") return (second.community?.commentCount || 0) - (first.community?.commentCount || 0);
    return 0;
  });
  async function deleteBlog() {
    setDeleting(true);
    try {
      const { data } = await axios.delete(`${BackendUrl}/api/v1/blog/delete/${selected._id}`, { withCredentials: true });
      onDeleted(selected._id);
      toast.success(data.message);
      setSelected(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "We couldn't delete this story. Please try again."));
    } finally {
      setDeleting(false);
    }
  }
  return (
    <section className="studio-library" aria-label="Story library">
      {!compact && <div className="studio-library-toolbar"><div className="studio-filters" role="group" aria-label="Filter stories">{[["all", "All stories"], ["published", "Published"], ["drafts", "Drafts"]].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{label} <span>{value === "all" ? blogs.length : blogs.filter((blog) => value === "published" ? blog.published : !blog.published).length}</span></button>)}</div><label className="studio-search"><FiSearch aria-hidden="true" /><input aria-label="Search your stories" placeholder="Search stories or topics..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>}
      {!compact && <div className="studio-community-filters"><WriterSelect label="Reader response" value={engagement} onChange={setEngagement} options={[{ value: "all", label: "All responses" }, { value: "upvoted", label: "With upvotes" }, { value: "rated", label: "With ratings" }, { value: "four-stars", label: "4+ stars" }]} /><WriterSelect label="Sort by" value={sort} onChange={setSort} options={[{ value: "order", label: "Library order" }, { value: "upvotes", label: "Most upvotes" }, { value: "stars", label: "Highest rated" }, { value: "comments", label: "Most discussed" }]} /></div>}
      {filtered.length ? <><div className="studio-library-label"><span>STORY</span><span>STATUS & ACTIONS</span></div><div className="studio-story-list">{filtered.map((blog) => <article key={blog._id} className="studio-story-row"><div className="studio-story-thumbnail">{blog.mainImage?.url ? <img src={blog.mainImage.url} alt="" /> : <FiFileText />}</div><div className="studio-story-copy"><span>{blog.category}</span><Link to={`/blog/update/${blog._id}`}><h3>{blog.title}</h3></Link><p>{blog.intro}</p><div className="studio-story-engagement"><span><FiArrowUp aria-hidden="true" />{blog.community?.upvoteCount || 0} upvotes</span><span><FiStar aria-hidden="true" />{blog.community?.ratingCount ? `${blog.community.averageRating.toFixed(1)} (${blog.community.ratingCount})` : "Unrated"}</span><span><FiMessageCircle aria-hidden="true" />{blog.community?.commentCount || 0} comments</span></div></div><div className="studio-story-actions"><span className={`studio-status${blog.published ? " published" : ""}`}><span />{blog.published ? "Published" : "Draft"}</span><div>{blog.published && <Link className="studio-action" to={`/blog/${blog._id}`} aria-label={`Read ${blog.title}`} title="View story"><FiArrowUpRight /></Link>}<Link className="studio-action" to={`/blog/update/${blog._id}`} aria-label={`Edit ${blog.title}`} title="Edit story"><FiEdit3 /></Link><button type="button" className="studio-action studio-danger-action" onClick={() => setSelected(blog)} aria-label={`Delete ${blog.title}`} title="Delete story"><FiTrash2 /></button></div></div></article>)}</div>{!compact && <div className="studio-library-summary" role="status">Showing {filtered.length} of {blogs.length} stories</div>}</> : <div className="studio-empty"><span className="studio-empty-icon"><FiFileText aria-hidden="true" /></span><h2>{blogs.length ? "No stories match your search" : "Your story starts here"}</h2><p>{blogs.length ? "Try a different search or filter to find what you're looking for." : "Turn an idea into your first story. Save it as a draft or share it with the world."}</p>{blogs.length ? <button className="studio-button secondary" onClick={() => { setSearch(""); setFilter("all"); setEngagement("all"); }}>Clear filters</button> : <Link className="studio-button" to="/dashboard?tab=create"><FiEdit3 aria-hidden="true" />Write your first story</Link>}</div>}
      {selected && <dialog ref={dialog} className="studio-dialog" aria-labelledby="delete-title" onCancel={(event) => { event.preventDefault(); if (!deleting) setSelected(null); }}><div className="studio-dialog-content"><button className="studio-dialog-close studio-action" aria-label="Cancel deletion" disabled={deleting} onClick={() => setSelected(null)}><FiX /></button><span className="studio-empty-icon"><FiTrash2 /></span><h2 id="delete-title">Delete this story?</h2><p><strong>{selected.title}</strong> will be permanently removed. This cannot be undone.</p><div className="studio-dialog-actions"><button className="studio-button secondary" disabled={deleting} onClick={() => setSelected(null)} autoFocus>Keep story</button><button className="studio-button danger" onClick={deleteBlog} disabled={deleting}>{deleting ? "Deleting..." : "Delete story"}</button></div></div></dialog>}
    </section>
  );
}
MyBlogs.propTypes = { blogs: PropTypes.array.isRequired, onDeleted: PropTypes.func.isRequired, compact: PropTypes.bool };
