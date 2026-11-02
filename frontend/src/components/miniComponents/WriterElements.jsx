import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiBookOpen, FiUsers } from "react-icons/fi";

export function WriterAvatar({ author, large = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const url = author.avatar?.url;
  const initials = author.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "W";
  return <span className={`writers-avatar${large ? " writers-avatar-large" : ""}`}>{url && failedUrl !== url ? <img src={url} alt="" loading={large ? "eager" : "lazy"} onError={() => setFailedUrl(url)} /> : <span aria-hidden="true">{initials}</span>}</span>;
}
WriterAvatar.propTypes = { author: PropTypes.object.isRequired, large: PropTypes.bool };

export function WritersState({ loading = false, error, retry, title, description }) {
  if (loading) return <div className="writers-loading" role="status" aria-label="Loading writers and stories"><span className="writers-loading-line" /><div className="writers-skeleton-grid">{[0, 1, 2].map((key) => <div key={key}><span /><i /><i /></div>)}</div><span className="writers-sr-only">Loading writers and stories...</span></div>;
  return <div className="writers-empty" role={error ? "alert" : undefined}><span className="writers-empty-icon"><FiUsers aria-hidden="true" /></span><h2>{title || "A brief pause in the conversation."}</h2><p>{error || description}</p>{error ? <button className="write-button" type="button" onClick={retry}>Try again</button> : <Link className="text-link" to="/blogs">Explore stories <FiArrowUpRight aria-hidden="true" /></Link>}</div>;
}
WritersState.propTypes = { loading: PropTypes.bool, error: PropTypes.string, retry: PropTypes.func, title: PropTypes.string, description: PropTypes.string };

export function WriterStoryCard({ story }) {
  const words = [story.intro, story.paraOneDescription, story.paraTwoDescription, story.paraThreeDescription].filter(Boolean).join(" ").trim();
  const minutes = Math.max(1, Math.ceil((words ? words.split(/\s+/).length : 0) / 200));
  return <Link to={`/blog/${story._id}`} className="story-card writers-story-card">{story.mainImage?.url ? <div className="story-image-wrap"><img className="story-image" src={story.mainImage.url} alt="" loading="lazy" /><span className="category-label">{story.category}</span></div> : <div className="writers-story-placeholder"><FiBookOpen aria-hidden="true" /><span>{story.category}</span></div>}<div className="story-card-copy"><h3>{story.title}</h3><p>{story.intro}</p><div className="writers-story-footer"><span><FiBookOpen aria-hidden="true" />{minutes} min read</span><span>Read story <FiArrowUpRight aria-hidden="true" /></span></div></div></Link>;
}
WriterStoryCard.propTypes = { story: PropTypes.object.isRequired };
