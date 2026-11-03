import { useContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiArrowUp, FiArrowUpRight, FiBookOpen, FiCheck, FiClock, FiCopy, FiMinus, FiPlus } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { BackendUrl } from "../../assets/frontendConstants";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";
import "../../reader.css";

const sectionKeys = ["paraOne", "paraTwo", "paraThree"];
function readingTime(story) {
  const text = [story.intro, ...sectionKeys.map((key) => story[`${key}Description`])].filter(Boolean).join(" ").trim();
  return Math.max(1, Math.ceil((text ? text.split(/\s+/).length : 0) / 200));
}

function StoryReader({ blog }) {
  const { blogs, user } = useContext(Context);
  const reducedMotion = useReducedMotion();
  const bodyRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("introduction");
  const [textSize, setTextSize] = useState(1);
  const sections = sectionKeys.map((key, index) => ({
    id: `chapter-${index + 1}`,
    title: blog[`${key}Title`],
    description: blog[`${key}Description`],
    image: blog[`${key}Image`]?.url,
  })).filter((section) => section.title || section.description || section.image);
  const contents = [{ id: "introduction", title: "Introduction" }, ...sections.map((section) => ({ id: section.id, title: section.title || `Section ${section.id.split("-")[1]}` }))];
  const authorId = typeof blog.createdBy === "object" ? blog.createdBy?._id : blog.createdBy;
  const related = blogs.filter((story) => story._id !== blog._id && story.published !== false)
    .sort((a, b) => Number(b.category === blog.category) - Number(a.category === blog.category)).slice(0, 3);
  const reveal = reducedMotion ? {} : { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.1 }, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } };

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${blog.title} | OpenBlogs`;
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => { document.title = previousTitle; };
  }, [blog._id, blog.title]);

  useEffect(() => {
    let frame = 0;
    const body = bodyRef.current;
    function measure() {
      frame = 0;
      if (!body) return;
      const bounds = body.getBoundingClientRect();
      const header = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
      const start = bounds.top + window.scrollY - header - 24;
      const end = bounds.bottom + window.scrollY - window.innerHeight;
      const distance = end - start;
      const next = distance > 0 ? (window.scrollY - start) / distance : bounds.bottom <= window.innerHeight ? 1 : 0;
      setProgress(Math.max(0, Math.min(1, next)));
      const headings = [...body.querySelectorAll("[data-reader-section]")];
      const current = headings.filter((heading) => heading.getBoundingClientRect().top <= header + 100).at(-1);
      setActiveSection(current?.id || "introduction");
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(measure);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    if (body) observer.observe(body);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [blog._id, textSize]);

  async function copyLink() {
    try {
      if (!navigator.clipboard?.writeText) {
        toast.error("Link copying is unavailable in this browser. You can copy the address from your address bar.");
        return;
      }
      await navigator.clipboard.writeText(`${window.location.origin}/blog/${blog._id}`);
      toast.success("Story link copied. Pass a good read along.");
    } catch (error) {
      console.error("Could not copy story link", error);
      toast.error("We couldn't copy the link. Copy the address from your address bar instead.");
    }
  }
  function goToSection(event, target) {
    event.preventDefault();
    const section = document.getElementById(target);
    const behavior = reducedMotion ? "instant" : "smooth";
    if (target === "story-top") window.scrollTo({ top: 0, behavior });
    else section?.scrollIntoView({ behavior, block: "start" });
    section?.focus({ preventScroll: true });
  }
  function renderContents() {
    return <nav aria-label="Story contents">{contents.map((item, index) => <a key={item.id} href={`#${item.id}`} onClick={(event) => goToSection(event, item.id)} aria-current={activeSection === item.id ? "location" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}</a>)}</nav>;
  }

  return (
    <main className="reader-page" id="story-top" tabIndex={-1}>
      <div className="reader-progress" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><motion.div animate={{ scaleX: progress }} transition={{ duration: reducedMotion ? 0 : 0.15 }} /></div>
      <div className="reader-shell">
        <div className="reader-trail"><Link to="/blogs"><FiArrowLeft aria-hidden="true" />All stories</Link><span>THE OPENBLOGS JOURNAL</span><span>{blog.category}</span></div>
        <motion.header className="reader-heading" {...reveal}>
          <div className="reader-heading-meta"><span className="reader-topic"><span />{blog.category}</span><span><FiClock aria-hidden="true" />{readingTime(blog)} min read</span>{blog.published === false && <span className="reader-draft-label">Draft preview</span>}</div>
          <h1>{blog.title}</h1>
          <p className="reader-heading-note">An independent perspective. A story worth slowing down for.</p>
          <div className="reader-byline-row"><div className="reader-byline">{blog.authorAvatar ? <img src={blog.authorAvatar} alt="" /> : <span className="reader-avatar">{blog.authorName?.slice(0, 1)}</span>}<div><span>Written by</span>{authorId ? <Link to={`/author/${authorId}`}>{blog.authorName}<FiArrowUpRight aria-hidden="true" /></Link> : <strong>{blog.authorName}</strong>}</div></div><div className="reader-toolbar"><div className="reader-text-controls" role="group" aria-label="Reading text size"><button type="button" disabled={textSize === 0} onClick={() => setTextSize((size) => size - 1)} aria-label="Decrease text size"><FiMinus aria-hidden="true" /></button><span aria-live="polite" aria-atomic="true">Aa<span className="reader-sr-only"> {["comfortable", "standard", "large"][textSize]} text</span></span><button type="button" disabled={textSize === 2} onClick={() => setTextSize((size) => size + 1)} aria-label="Increase text size"><FiPlus aria-hidden="true" /></button></div><button type="button" className="reader-share" onClick={copyLink}><FiCopy aria-hidden="true" /><span>Copy link</span></button></div></div>
        </motion.header>
        {blog.mainImage?.url && <motion.figure className="reader-cover" {...reveal}><img src={blog.mainImage.url} alt={`Cover for ${blog.title}`} fetchPriority="high" /><figcaption><span>OPENBLOGS / {blog.category}</span><span>Words that bring us closer.</span></figcaption></motion.figure>}
        <div className="reader-layout">
          <aside className="reader-sidebar"><div className="reader-sidebar-inner"><span className="reader-kicker">IN THIS STORY</span>{renderContents()}<div className="reader-reading-status"><div><FiBookOpen aria-hidden="true" /><span>{Math.round(progress * 100)}% read</span></div><div className="reader-small-progress"><span style={{ width: `${progress * 100}%` }} /></div><p>Take your time.<br />Good ideas deserve a little space.</p></div><button className="text-link" type="button" onClick={copyLink}>Share this perspective <FiArrowUpRight aria-hidden="true" /></button></div></aside>
          <article className={`reader-article reader-text-${textSize}`}>
            <details className="reader-mobile-contents"><summary>In this story <span>{contents.length} {contents.length === 1 ? "part" : "parts"}</span></summary>{renderContents()}</details>
            <div className="reader-prose" ref={bodyRef}>
              <motion.section className="reader-introduction" id="introduction" data-reader-section tabIndex={-1} aria-label="Introduction" {...reveal}><span className="reader-kicker">THE STORY</span><p>{blog.intro}</p></motion.section>
              {sections.map((section, index) => <motion.section className="reader-chapter" key={section.id} id={section.id} data-reader-section tabIndex={-1} aria-label={section.title || `Section ${index + 1}`} {...reveal}>{section.title && <><span className="reader-chapter-number">/ {String(index + 1).padStart(2, "0")}</span><h2>{section.title}</h2></>}{section.image && <figure><img src={section.image} alt={section.title ? `Illustration for ${section.title}` : `Story section ${index + 1} illustration`} loading="lazy" decoding="async" /></figure>}{section.description && <p>{section.description}</p>}</motion.section>)}
              <div className="reader-story-end" aria-hidden="true"><span /><i /><span /></div>
            </div>
            <motion.div className="reader-finish" {...reveal}><div className="reader-finish-icon"><FiCheck aria-hidden="true" /></div><span className="reader-kicker">A MOMENT WELL SPENT</span><h2>Good stories stay with you.</h2><p>If this one gave you a new perspective, pass it on. The best ideas are the ones we share.</p><div><button type="button" className="write-button" onClick={copyLink}><FiCopy aria-hidden="true" />Share this story</button><a className="text-link" href="#more-stories" onClick={(event) => goToSection(event, "more-stories")}>Find your next read <FiArrowRight aria-hidden="true" /></a></div></motion.div>
            <motion.div className="reader-author-card" {...reveal}>{blog.authorAvatar && <img src={blog.authorAvatar} alt="" loading="lazy" />}<div><span className="reader-kicker">THE VOICE BEHIND THE STORY</span><h2>{blog.authorName}</h2><p>An independent voice in the OpenBlogs community.</p>{authorId && <Link className="text-link" to={`/author/${authorId}`}>More from this writer <FiArrowUpRight aria-hidden="true" /></Link>}</div></motion.div>
          </article>
          <div className="reader-margin-note" aria-hidden="true"><span>INDEPENDENT VOICES.</span><span>SHARED PERSPECTIVES.</span></div>
        </div>
        <motion.section className="reader-more" id="more-stories" tabIndex={-1} {...reveal}><div className="section-heading"><div><span className="section-kicker">STAY CURIOUS</span><h2>{related.length ? "One good read leads to another." : "There is always another perspective."}</h2><p>{related.length ? "A few more stories to keep your curiosity going." : "Explore the journal for your next story worth slowing down for."}</p></div><Link className="text-link" to="/blogs">Explore all stories <FiArrowUpRight aria-hidden="true" /></Link></div>{related.length > 0 && <div className="story-grid reader-related-grid">{related.map((story, index) => <Link className="story-card" to={`/blog/${story._id}`} key={story._id} style={{ "--story-order": index }}>{story.mainImage?.url && <div className="story-image-wrap"><img className="story-image" src={story.mainImage.url} alt="" loading="lazy" /><span className="category-label">{story.category}</span></div>}<div className="story-card-copy"><h3>{story.title}</h3><p>{story.intro}</p><div className="story-byline">{story.authorAvatar && <img src={story.authorAvatar} alt="" loading="lazy" />}<span>{story.authorName}</span><span className="byline-dot" /><span>{readingTime(story)} min read</span></div></div></Link>)}</div>}</motion.section>
        <div className="reader-bottom-bar"><Link to={user?.role === "Author" ? "/dashboard?tab=create" : "/blogs"}><FiBookOpen aria-hidden="true" />{user?.role === "Author" ? "Have a perspective of your own? Write a story." : "More voices. More perspectives. Keep exploring."}<FiArrowRight aria-hidden="true" /></Link><a href="#story-top" className="text-link" onClick={(event) => goToSection(event, "story-top")}>Back to top <FiArrowUp aria-hidden="true" /></a></div>
      </div>
    </main>
  );
}
StoryReader.propTypes = { blog: PropTypes.object.isRequired };

export default function SingleBlog() {
  const { isAuthenticated, isAuthLoading, setIsAuthenticated, setUser } = useContext(Context);
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, blog: null, error: "", status: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    const controller = new AbortController();
    setResult({ id: null, blog: null, error: "", status: null });
    async function load() {
      try {
        const { data } = await axios.get(`${BackendUrl}/api/v1/blog/singleblog/${id}`, { withCredentials: true, signal: controller.signal });
        if (!data.blog?._id || !data.blog.title) {
          console.error("The server returned an incomplete story.");
          setResult({ id, blog: null, error: "This story is incomplete and cannot be displayed. Please retry or choose another story.", status: 502 });
          return;
        }
        setResult({ id, blog: data.blog, error: "", status: 200 });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not load story", error);
        setResult({ id, blog: null, error: getApiErrorMessage(error, "We couldn't open this story. Please try again."), status: error.response?.status });
        if (error.response?.status === 401) {
          setIsAuthenticated(false);
          setUser({});
        }
      }
    }
    load();
    return () => controller.abort();
  }, [id, attempt, isAuthenticated, isAuthLoading, setIsAuthenticated, setUser]);

  if (!isAuthLoading && (!isAuthenticated || result.status === 401)) return <main className="reader-state"><FiBookOpen aria-hidden="true" /><span className="section-kicker">YOUR NEXT GOOD READ</span><h1>A story worth signing in for.</h1><p>Sign in to read the full story and discover independent voices on OpenBlogs.</p><Link className="write-button" to="/login" state={{ returnTo: `/blog/${id}` }}>Sign in to read <FiArrowRight aria-hidden="true" /></Link><Link className="text-link" to="/blogs">Browse stories</Link></main>;
  if (result.id === id && result.error) return <main className="reader-state" role="alert"><FiBookOpen aria-hidden="true" /><span className="section-kicker">A BRIEF INTERRUPTION</span><h1>{result.status === 404 ? "This story is no longer here." : "We couldn't turn this page."}</h1><p>{result.error}</p><button className="write-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button><Link className="text-link" to="/blogs">Find another story <FiArrowRight aria-hidden="true" /></Link></main>;
  if (isAuthLoading || result.id !== id || !result.blog) return <main className="reader-skeleton" role="status" aria-label="Loading story"><span /><div /><div /><span /><figure /><p /><p /></main>;
  return <StoryReader key={id} blog={result.blog} />;
}
