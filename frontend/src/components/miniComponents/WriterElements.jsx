import { useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiArrowUp, FiArrowUpRight, FiAward, FiBookOpen, FiCheck, FiChevronDown, FiMessageCircle, FiStar, FiUsers } from "react-icons/fi";
import { writerBio } from "../../assets/useWriters";

export function WriterSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef({ text: "", time: 0 });
  const id = useId();
  const reducedMotion = useReducedMotion();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[aria-selected="true"]')?.focus();
    function dismiss(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function choose(nextValue) {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeys(event) {
    const buttons = Array.from(listRef.current.querySelectorAll('[role="option"]'));
    const index = buttons.indexOf(document.activeElement);
    let nextIndex;
    switch (event.key) {
      case "ArrowDown": nextIndex = (index + 1) % buttons.length; break;
      case "ArrowUp": nextIndex = (index - 1 + buttons.length) % buttons.length; break;
      case "Home": nextIndex = 0; break;
      case "End": nextIndex = buttons.length - 1; break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      default: {
        if (event.key.length !== 1 || event.key === " " || event.ctrlKey || event.metaKey || event.altKey) return;
        const now = Date.now();
        const previous = searchRef.current;
        const text = (now - previous.time < 600 ? previous.text : "") + event.key.toLowerCase();
        searchRef.current = { text, time: now };
        nextIndex = options.findIndex((option) => option.label.toLowerCase().startsWith(text));
        break;
      }
    }
    event.preventDefault();
    buttons[nextIndex]?.focus();
  }

  return <div className="writers-select writers-custom-select" ref={containerRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <span id={`${id}-label`}>{label}</span>
    <button className="writers-select-trigger" type="button" ref={triggerRef} aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined} onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); } }}>
      <span id={`${id}-value`}>{selected?.label}</span><FiChevronDown aria-hidden="true" />
    </button>
    <AnimatePresence>
      {open && <motion.div className="writers-select-options" id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} ref={listRef} onKeyDown={handleKeys} initial={{ opacity: 0, y: reducedMotion ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }} transition={{ duration: reducedMotion ? 0 : .16 }}>
        {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={value === option.value} tabIndex={-1} onClick={() => choose(option.value)}><span>{option.label}</span>{value === option.value && <FiCheck aria-hidden="true" />}</button>)}
      </motion.div>}
    </AnimatePresence>
  </div>;
}
WriterSelect.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired, options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })).isRequired, onChange: PropTypes.func.isRequired };

export function WriterAvatar({ author, large = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const url = author.avatar?.url;
  const initials = author.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "W";
  return <span className={`writers-avatar${large ? " writers-avatar-large" : ""}`}>{url && failedUrl !== url ? <img src={url} alt="" loading={large ? "eager" : "lazy"} onError={() => setFailedUrl(url)} /> : <span aria-hidden="true">{initials}</span>}</span>;
}
WriterAvatar.propTypes = { author: PropTypes.object.isRequired, large: PropTypes.bool };

export function WriterCard({ author, writing, topics, reputation, rank }) {
  const profile = `/author/${author._id}`;
  return <article className="writers-card" data-ranked={Boolean(rank)}>
    <div className="writers-card-top"><span className="writers-card-label"><FiAward aria-hidden="true" />{rank ? `#${rank} in the community` : "Independent writer"}</span><span className="writers-card-score"><strong>{reputation.score}</strong> points</span></div>
    <div className="writers-card-identity"><Link className="writers-card-avatar" to={profile} aria-label={`View ${author.name}'s profile`}><WriterAvatar author={author} /></Link><div><h3><Link to={profile}>{author.name}</Link></h3><p>{writerBio(author, writing)}</p></div></div>
    <dl className="writers-card-metrics">
      <div><dt><FiArrowUp aria-hidden="true" />Upvotes</dt><dd>{reputation.upvoteCount}</dd></div>
      <div><dt><FiStar aria-hidden="true" />Rating ({reputation.ratingCount})</dt><dd>{reputation.ratingCount ? <>{reputation.averageRating.toFixed(1)}<small>/ 5</small></> : <span>Unrated</span>}</dd></div>
      <div><dt><FiBookOpen aria-hidden="true" />Stories</dt><dd>{writing.length}</dd></div>
    </dl>
    <div className="writers-topic-tags" aria-label="Writing topics">{topics.length ? topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>) : <span>New voice</span>}{topics.length > 3 && <span>+{topics.length - 3} more</span>}</div>
    <div className="writers-card-bottom"><span className="writers-card-comments"><FiMessageCircle aria-hidden="true" />{reputation.commentCount} {reputation.commentCount === 1 ? "comment" : "comments"}</span><Link to={profile} className="text-link" aria-label={`Read more about ${author.name}`}>View profile <FiArrowUpRight aria-hidden="true" /></Link></div>
  </article>;
}
WriterCard.propTypes = { author: PropTypes.object.isRequired, writing: PropTypes.array.isRequired, topics: PropTypes.array.isRequired, reputation: PropTypes.object.isRequired, rank: PropTypes.number };

export function StoryEngagement({ community }) {
  const { upvoteCount = 0, averageRating = 0, ratingCount = 0 } = community || {};
  return <div className="story-engagement" aria-label="Story reactions"><span><FiArrowUp aria-hidden="true" />{upvoteCount} {upvoteCount === 1 ? "upvote" : "upvotes"}</span><span><FiStar aria-hidden="true" />{ratingCount ? `${averageRating.toFixed(1)} / 5 (${ratingCount})` : "Not rated yet"}</span></div>;
}
StoryEngagement.propTypes = { community: PropTypes.object };

export function WritersState({ loading = false, error, retry, title, description }) {
  if (loading) return <div className="writers-loading" role="status" aria-label="Loading writers and stories"><span className="writers-loading-line" /><div className="writers-skeleton-grid">{[0, 1, 2].map((key) => <div key={key}><span /><i /><i /></div>)}</div><span className="writers-sr-only">Loading writers and stories...</span></div>;
  return <div className="writers-empty" role={error ? "alert" : undefined}><span className="writers-empty-icon"><FiUsers aria-hidden="true" /></span><h2>{title || "A brief pause in the conversation."}</h2><p>{error || description}</p>{error ? <button className="write-button" type="button" onClick={retry}>Try again</button> : <Link className="text-link" to="/blogs">Explore stories <FiArrowUpRight aria-hidden="true" /></Link>}</div>;
}
WritersState.propTypes = { loading: PropTypes.bool, error: PropTypes.string, retry: PropTypes.func, title: PropTypes.string, description: PropTypes.string };

export function WriterStoryCard({ story }) {
  const words = [story.intro, story.paraOneDescription, story.paraTwoDescription, story.paraThreeDescription].filter(Boolean).join(" ").trim();
  const minutes = Math.max(1, Math.ceil((words ? words.split(/\s+/).length : 0) / 200));
  return <Link to={`/blog/${story._id}`} className="story-card writers-story-card">{story.mainImage?.url ? <div className="story-image-wrap"><img className="story-image" src={story.mainImage.url} alt="" loading="lazy" /><span className="category-label">{story.category}</span></div> : <div className="writers-story-placeholder"><FiBookOpen aria-hidden="true" /><span>{story.category}</span></div>}<div className="story-card-copy"><h3>{story.title}</h3><p>{story.intro}</p><div className="writers-engagement"><span><FiArrowUp aria-hidden="true" />{story.community?.upvoteCount || 0} upvotes</span><span><FiStar aria-hidden="true" />{story.community?.ratingCount ? `${story.community.averageRating.toFixed(1)} (${story.community.ratingCount})` : "Unrated"}</span></div><div className="writers-story-footer"><span><FiBookOpen aria-hidden="true" />{minutes} min read</span><span>Read story <FiArrowUpRight aria-hidden="true" /></span></div></div></Link>;
}
WriterStoryCard.propTypes = { story: PropTypes.object.isRequired };
