import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiArrowUp, FiAward, FiBookOpen, FiCalendar, FiFeather, FiSearch, FiStar, FiX } from "react-icons/fi";
import useWriters, { rankWriters, storiesByWriter, writerReputation, writerTopics } from "../../assets/useWriters";
import { WriterAvatar, WriterSelect, WriterStoryCard, WritersState } from "../miniComponents/WriterElements";
import "../../writers.css";

function AuthorProfile() {
  const { authorId } = useParams();
  const { authors, stories, loading, error, retry } = useWriters();
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [sort, setSort] = useState("order");
  const author = authors.find((writer) => String(writer._id) === authorId);
  const writing = storiesByWriter(stories, authorId);
  const topics = writerTopics(writing);
  const reputation = writerReputation(writing);
  const rank = rankWriters(authors, stories).find((writer) => String(writer.author._id) === authorId)?.rank;
  const filtered = writing.filter((story) => (topic === "all" || story.category === topic) && `${story.title} ${story.intro} ${story.category}`.toLowerCase().includes(query.trim().toLowerCase())).sort((first, second) => {
    if (sort === "upvotes") return (second.community?.upvoteCount || 0) - (first.community?.upvoteCount || 0);
    if (sort === "stars") return (second.community?.averageRating || 0) - (first.community?.averageRating || 0) || (second.community?.ratingCount || 0) - (first.community?.ratingCount || 0);
    return 0;
  });
  const joined = author?.createdOn ? new Date(author.createdOn) : null;
  const joinedLabel = joined && !Number.isNaN(joined.getTime()) ? joined.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";
  const reveal = reducedMotion ? {} : { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.1 }, transition: { duration: 0.55 } };
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [authorId]);
  useEffect(() => {
    const previous = document.title;
    document.title = author ? `${author.name} | OpenBlogs` : "Writer profile | OpenBlogs";
    return () => { document.title = previous; };
  }, [author]);
  function clearFilters() { setQuery(""); setTopic("all"); }

  return <main className="writers-page writers-profile-page">
    <div className="writers-profile-trail"><Link className="text-link" to="/authors"><FiArrowLeft aria-hidden="true" />All writers</Link><span>THE OPENBLOGS COMMUNITY</span></div>
    {loading || error ? <WritersState loading={loading} error={error} retry={retry} /> : !author ? <div className="writers-empty"><span className="writers-empty-icon"><FiFeather aria-hidden="true" /></span><h1>This writer could not be found.</h1><p>The profile may no longer be available. There are still plenty of voices to discover.</p><Link className="write-button" to="/authors">Meet other writers <FiArrowRight aria-hidden="true" /></Link></div> : <>
      <motion.header className="writers-profile-hero" {...reveal}><div className="writers-profile-cover" aria-hidden="true"><span>INDEPENDENT VOICES. SHARED PERSPECTIVES.</span><FiFeather /></div><div className="writers-profile-identity"><WriterAvatar author={author} large /><div className="writers-profile-heading"><span className="section-kicker">WRITER ON OPENBLOGS</span><h1>{author.name}</h1><p>{topics.length ? `Stories and perspectives on ${topics.slice(0, 3).join(", ")}${topics.length > 3 ? ", and more" : ""}.` : "An independent voice. A new perspective waiting to unfold."}</p>{joinedLabel && <span className="writers-joined"><FiCalendar aria-hidden="true" />Writing here since {joinedLabel}</span>}</div><a className="write-button" href="#author-writing"><FiBookOpen aria-hidden="true" />Explore their writing</a></div><div className="writers-profile-details"><div className="writers-profile-counts"><span><strong>{writing.length}</strong>published {writing.length === 1 ? "story" : "stories"}</span><span><strong>{topics.length}</strong>{topics.length === 1 ? "topic" : "topics"} explored</span></div><div className="writers-topic-tags" aria-label="Author's topics">{topics.map((item) => <span key={item}>{item}</span>)}</div></div></motion.header>
      <div className="writers-author-recognition"><span><FiAward aria-hidden="true" /><strong>{rank ? `#${rank}` : "New voice"}</strong><small>Community rank</small></span><span><FiArrowUp aria-hidden="true" /><strong>{reputation.upvoteCount}</strong><small>Upvotes received</small></span><span><FiStar aria-hidden="true" /><strong>{reputation.ratingCount ? reputation.averageRating.toFixed(1) : "Unrated"}</strong><small>{reputation.ratingCount} reader ratings</small></span></div>
      <section id="author-writing" className="writers-author-writing" aria-labelledby="author-writing-title"><motion.div className="writers-section-heading" {...reveal}><div><span className="section-kicker">FROM THIS WRITER</span><h2 id="author-writing-title">The story so far.</h2></div><p>Ideas, experiences, and a point of view all their own.</p></motion.div>
        {writing.length ? <>
          <div className="writers-directory-toolbar">
            <label className="writers-search"><FiSearch aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search this writer's stories" placeholder="Find a story that speaks to you..." />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear story search"><FiX aria-hidden="true" /></button>}</label>
            <WriterSelect label="Topic" value={topic} onChange={setTopic} options={[{ value: "all", label: "All topics" }, ...topics.map((item) => ({ value: item, label: item }))]} />
            <WriterSelect label="Sort by" value={sort} onChange={setSort} options={[{ value: "order", label: "Story order" }, { value: "upvotes", label: "Most upvotes" }, { value: "stars", label: "Highest rated" }]} />
          </div>
          <div className="writers-results" role="status">{filtered.length} {filtered.length === 1 ? "story" : "stories"}{query || topic !== "all" ? " matching your filters" : " to spend a little time with"}{(query || topic !== "all") && <button className="text-link" type="button" onClick={clearFilters}>Reset filters <FiX aria-hidden="true" /></button>}</div>
          {filtered.length ? <div className="story-grid writers-stories-grid">{filtered.map((story, index) => <motion.div key={story._id} {...reveal} transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : Math.min(index, 5) * 0.05 }}><WriterStoryCard story={story} /></motion.div>)}</div> : <div className="writers-empty"><span className="writers-empty-icon"><FiSearch aria-hidden="true" /></span><h2>No stories match these filters.</h2><p>Try a different search or explore another topic from this writer.</p><button className="write-button" type="button" onClick={clearFilters}>Show all stories</button></div>}
        </> : <WritersState title="Every writer starts with a blank page." description={`${author.name} has not published a story yet. Come back for their first chapter, or discover another voice in the meantime.`} />}
      </section>
      <motion.div className="writers-profile-outro" {...reveal}><FiFeather aria-hidden="true" /><div><h2>One voice is just the beginning.</h2><p>Discover more independent writers and a world of different perspectives.</p></div><Link className="text-link" to="/authors">Meet more writers <FiArrowRight aria-hidden="true" /></Link></motion.div>
    </>}
  </main>;
}

export default function ParticularAuthorProfile() {
  const { authorId } = useParams();
  return <AuthorProfile key={authorId} />;
}
