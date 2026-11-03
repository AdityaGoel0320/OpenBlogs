import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiArrowUp, FiCheck, FiMessageCircle, FiRefreshCw, FiSend, FiStar, FiTrash2, FiX } from "react-icons/fi";
import { Context } from "../../main";
import { BackendUrl } from "../../assets/frontendConstants";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";

const emptyStats = { upvoteCount: 0, averageRating: 0, ratingCount: 0, commentCount: 0 };

export default function StoryCommunity({ blog }) {
  const { user, setBlogs } = useContext(Context);
  const reducedMotion = useReducedMotion();
  const [stats, setStats] = useState(emptyStats);
  const [viewer, setViewer] = useState({ upvoted: false, stars: 0 });
  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [draft, setDraft] = useState("");
  const [hoverStars, setHoverStars] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const authorId = typeof blog.createdBy === "object" ? blog.createdBy?._id : blog.createdBy;
  const ownStory = Boolean(user?._id && String(authorId) === String(user._id));
  const baseUrl = `${BackendUrl}/api/v1/blog/${blog._id}`;

  function applyStats(community) {
    setStats(community);
    setBlogs((current) => current.map((story) => story._id === blog._id ? { ...story, community } : story));
  }

  useEffect(() => {
    if (blog.published === false) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    async function load() {
      try {
        const { data } = await axios.get(`${baseUrl}/community`, { withCredentials: true, signal: controller.signal });
        setStats(data.community);
        setViewer(data.viewer);
        setComments(data.comments);
        setNextCursor(data.nextCursor);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(error, "We couldn't load the conversation. Please try again."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [baseUrl, blog.published, attempt]);

  async function reactToStory(kind, payload) {
    if (pending) return;
    setPending(kind);
    setActionError("");
    try {
      const { data } = await axios.put(`${baseUrl}/${kind}`, payload, { withCredentials: true });
      applyStats(data.community);
      setViewer(data.viewer);
      setMessage(kind === "upvote" ? "Your upvote has been updated." : "Your star rating has been updated.");
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Your reaction wasn't saved. Please try again."));
    } finally {
      setPending("");
    }
  }

  async function postComment(event) {
    event.preventDefault();
    if (pending || !draft.trim()) return;
    setPending("comment");
    setActionError("");
    try {
      const { data } = await axios.post(`${baseUrl}/comments`, { body: draft.trim() }, { withCredentials: true });
      setComments((current) => [data.comment, ...current]);
      applyStats(data.community);
      setDraft("");
      setMessage("Your comment was posted.");
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Your comment wasn't posted. Your text is still here to retry."));
    } finally {
      setPending("");
    }
  }

  async function removeComment(id) {
    if (pending) return;
    setPending("delete");
    setActionError("");
    try {
      const { data } = await axios.delete(`${baseUrl}/comments/${id}`, { withCredentials: true });
      setComments((current) => current.filter((comment) => comment._id !== id));
      applyStats(data.community);
      setDeleteId(null);
      setMessage("Comment deleted.");
    } catch (error) {
      setActionError(getApiErrorMessage(error, "We couldn't delete this comment. Please try again."));
    } finally {
      setPending("");
    }
  }

  async function loadMore() {
    if (pending || !nextCursor) return;
    setPending("more");
    setActionError("");
    try {
      const { data } = await axios.get(`${baseUrl}/community`, { params: { before: nextCursor }, withCredentials: true });
      setComments((current) => [...current, ...data.comments.filter((item) => !current.some((existing) => existing._id === item._id))]);
      setNextCursor(data.nextCursor);
      applyStats(data.community);
      setViewer(data.viewer);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "We couldn't load more comments. Please try again."));
    } finally {
      setPending("");
    }
  }

  if (blog.published === false) return null;

  return <section className="community-section" aria-labelledby="story-community-title">
    <header className="community-heading"><div><span className="reader-kicker">THE COMMUNITY</span><h2 id="story-community-title">Keep the conversation going.</h2></div><FiMessageCircle aria-hidden="true" /></header>
    {loading && <output className="community-loading">Loading reactions and comments...</output>}
    {!loading && loadError && <div className="community-error" role="alert"><p>{loadError}</p><button className="text-link" type="button" onClick={() => setAttempt((value) => value + 1)}><FiRefreshCw aria-hidden="true" />Try again</button></div>}
    {!loading && !loadError && <>
      <div className="community-reactions">
        <button className={`community-upvote${viewer.upvoted ? " is-active" : ""}`} type="button" aria-pressed={viewer.upvoted} disabled={Boolean(pending) || ownStory} title={ownStory ? "Only other readers can upvote your story" : "Upvote this story"} onClick={() => { void reactToStory("upvote", { upvoted: !viewer.upvoted }); }}><FiArrowUp aria-hidden="true" /><span>Upvote</span><strong>{stats.upvoteCount}</strong></button>
        <div className="community-rating"><span><FiStar aria-hidden="true" />{stats.ratingCount ? stats.averageRating.toFixed(1) : "No ratings yet"}<small>{stats.ratingCount} {stats.ratingCount === 1 ? "rating" : "ratings"}</small></span><div className="community-stars" role="group" aria-label="Rate this story" onMouseLeave={() => setHoverStars(0)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHoverStars(0); }}>{[1, 2, 3, 4, 5].map((stars) => <button key={stars} className={stars <= (hoverStars || viewer.stars) ? "is-filled" : ""} type="button" disabled={Boolean(pending) || ownStory} aria-label={`Rate ${stars} out of 5 stars`} aria-pressed={viewer.stars === stars} title={ownStory ? "Only other readers can rate your story" : `${stars} out of 5 stars`} onMouseEnter={() => setHoverStars(stars)} onFocus={() => setHoverStars(stars)} onClick={() => { void reactToStory("rating", { stars }); }}><FiStar aria-hidden="true" /></button>)}</div>{viewer.stars > 0 && <button className="text-link community-clear-rating" type="button" disabled={Boolean(pending)} onClick={() => { void reactToStory("rating", { stars: 0 }); }}>Remove my rating <FiX aria-hidden="true" /></button>}</div>
      </div>
      {ownStory && <p className="community-note">Upvotes and ratings come from other readers. You can join the conversation below.</p>}
      <div className="community-comments-heading"><h3>Discussion <span>{stats.commentCount}</span></h3><span>Newest first</span></div>
      <form className="community-composer" onSubmit={postComment}><label htmlFor={`comment-${blog._id}`}>Add your perspective</label><textarea id={`comment-${blog._id}`} value={draft} maxLength={2000} rows={3} disabled={pending === "comment"} onChange={(event) => setDraft(event.target.value)} placeholder="What stood out to you?" required /><div><span>{draft.length}/2,000</span><button className="write-button" type="submit" disabled={Boolean(pending) || !draft.trim()}><FiSend aria-hidden="true" />{pending === "comment" ? "Posting..." : "Post comment"}</button></div></form>
      <output className="community-feedback" aria-live="polite">{message}</output>
      {actionError && <p className="community-error" role="alert">{actionError}</p>}
      <div className="community-comments"><AnimatePresence initial={false}>{comments.map((comment) => <motion.article className="community-comment" key={comment._id} initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }} transition={{ duration: reducedMotion ? 0 : .18 }}>
        <span className="community-avatar" aria-hidden="true">{comment.user?.avatar?.url ? <img src={comment.user.avatar.url} alt="" loading="lazy" /> : comment.user?.name?.slice(0, 1) || "R"}</span>
        <div className="community-comment-content"><header><strong>{comment.user?.name || "Former member"}</strong>{String(comment.user?._id) === String(authorId) && <span className="community-author-badge">Author</span>}<time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>{comment.canDelete && <button className="community-delete" type="button" title="Delete comment" aria-label={`Delete comment by ${comment.user?.name || "former member"}`} onClick={() => setDeleteId(comment._id)}><FiTrash2 aria-hidden="true" /></button>}</header><p>{comment.body}</p>{deleteId === comment._id && <div className="community-delete-confirm"><span>Delete this comment?</span><button type="button" disabled={Boolean(pending)} onClick={() => { void removeComment(comment._id); }}><FiCheck aria-hidden="true" />{pending === "delete" ? "Deleting..." : "Delete"}</button><button type="button" disabled={Boolean(pending)} onClick={() => setDeleteId(null)}><FiX aria-hidden="true" />Cancel</button></div>}</div>
      </motion.article>)}</AnimatePresence></div>
      {!comments.length && <p className="community-empty">No comments yet. Be the first to share a thoughtful perspective.</p>}
      {nextCursor && <button className="text-link community-load-more" type="button" disabled={Boolean(pending)} onClick={() => { void loadMore(); }}><FiMessageCircle aria-hidden="true" />{pending === "more" ? "Loading..." : "Load more comments"}</button>}
    </>}
  </section>;
}

StoryCommunity.propTypes = { blog: PropTypes.object.isRequired };