import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiArrowUpRight, FiBookOpen, FiFeather, FiSearch, FiUsers, FiX } from "react-icons/fi";
import { Context } from "../../main";
import useWriters, { storiesByWriter, writerTopics } from "../../assets/useWriters";
import { WriterAvatar, WriterSelect, WritersState } from "../miniComponents/WriterElements";
import "../../writers.css";

export default function AllAuthors() {
  const { authors, stories, loading, error, retry } = useWriters();
  const { isAuthenticated, user } = useContext(Context);
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [sort, setSort] = useState("name");
  const topics = writerTopics(stories);
  const writers = authors.map((author) => {
    const writing = storiesByWriter(stories, author._id);
    return { author, writing, topics: writerTopics(writing) };
  });
  const filtered = writers.filter((writer) => (topic === "all" || writer.topics.includes(topic)) && `${writer.author.name} ${writer.topics.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === "stories" ? b.writing.length - a.writing.length || a.author.name.localeCompare(b.author.name) : a.author.name.localeCompare(b.author.name));
  const reveal = reducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.1 }, transition: { duration: 0.5 } };
  useEffect(() => {
    const previous = document.title;
    document.title = "Meet the writers | OpenBlogs";
    return () => { document.title = previous; };
  }, []);
  function clearFilters() { setQuery(""); setTopic("all"); }

  return <main className="writers-page">
    <motion.header className="writers-directory-hero" {...reveal}><div><span className="section-kicker">THE PEOPLE BEHIND THE PAGES</span><h1>Different voices.<br /><em>Endless perspectives.</em></h1><p>Meet the independent minds turning everyday experiences into stories worth sharing. Find a voice that speaks to you.</p><a className="text-link" href="#writer-directory">Find your next favorite writer <FiArrowRight aria-hidden="true" /></a></div><div className="writers-hero-art" aria-hidden="true"><div className="writers-orbit" /><span className="writers-art-icon"><FiFeather /></span><span className="writers-art-note">A little curiosity.<br />A whole world of voices.</span><span className="writers-art-label">THE OPENBLOGS COMMUNITY</span></div></motion.header>
    {!loading && !error && <motion.div className="writers-community-stats" {...reveal}><span><FiUsers aria-hidden="true" /><strong>{authors.length}</strong>{authors.length === 1 ? "independent writer" : "independent writers"}</span><span><FiBookOpen aria-hidden="true" /><strong>{stories.length}</strong>published {stories.length === 1 ? "story" : "stories"}</span><span><FiFeather aria-hidden="true" /><strong>{topics.length}</strong>{topics.length === 1 ? "topic to explore" : "topics to explore"}</span></motion.div>}
    <section id="writer-directory" className="writers-directory" aria-labelledby="writers-directory-title"><div className="writers-section-heading"><div><span className="section-kicker">FIND YOUR PEOPLE</span><h2 id="writers-directory-title">Meet the writers</h2></div><p>Follow your curiosity. Start a new chapter.</p></div>
      {loading || error ? <WritersState loading={loading} error={error} retry={retry} /> : authors.length === 0 ? <WritersState title="A community waiting for its first voice." description="Writer profiles will appear here as people join OpenBlogs. In the meantime, explore the journal." /> : <>
        <div className="writers-directory-toolbar">
          <label className="writers-search"><FiSearch aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search writers by name or topic" placeholder="Search a name or a topic..." />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear writer search"><FiX aria-hidden="true" /></button>}</label>
          <WriterSelect label="Topic" value={topic} onChange={setTopic} options={[{ value: "all", label: "All topics" }, ...topics.map((item) => ({ value: item, label: item }))]} />
          <WriterSelect label="Sort by" value={sort} onChange={setSort} options={[{ value: "name", label: "Name A-Z" }, { value: "stories", label: "Most stories" }]} />
        </div>
        <div className="writers-results" role="status">{filtered.length} {filtered.length === 1 ? "writer" : "writers"}{query || topic !== "all" ? " matching your filters" : " to discover"}{(query || topic !== "all") && <button className="text-link" type="button" onClick={clearFilters}>Reset filters <FiX aria-hidden="true" /></button>}</div>
        {filtered.length ? <div className="writers-card-grid">{filtered.map(({ author, writing, topics: authorTopics }, index) => <motion.article key={author._id} className="writers-card" {...reveal} transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : Math.min(index, 5) * 0.05 }}><div className="writers-card-top"><span className="writers-card-label"><FiFeather aria-hidden="true" />Independent writer</span><FiArrowUpRight aria-hidden="true" /></div><WriterAvatar author={author} /><h3><Link to={`/author/${author._id}`}>{author.name}</Link></h3><p>{writing.length ? `Exploring ${authorTopics.slice(0, 2).join(" and ")} through a personal lens.` : "A new voice, with a world of stories ahead."}</p><div className="writers-topic-tags" aria-label="Writing topics">{authorTopics.slice(0, 3).map((item) => <span key={item}>{item}</span>)}{authorTopics.length > 3 && <span>+{authorTopics.length - 3} more</span>}{!authorTopics.length && <span>Finding their first words</span>}</div><div className="writers-card-bottom"><span><strong>{writing.length}</strong> {writing.length === 1 ? "story" : "stories"}</span><Link to={`/author/${author._id}`} className="text-link" aria-label={`View ${author.name}'s profile`}>View profile <FiArrowRight aria-hidden="true" /></Link></div></motion.article>)}</div> : <div className="writers-empty"><span className="writers-empty-icon"><FiSearch aria-hidden="true" /></span><h2>No writers match just yet.</h2><p>Try a different name or topic. Another perspective is never far away.</p><button className="write-button" type="button" onClick={clearFilters}>Clear filters</button></div>}
      </>}
    </section>
    <motion.section className="writers-invitation" {...reveal}><div><span className="section-kicker">THERE IS ROOM FOR YOUR VOICE, TOO</span><h2>Your perspective belongs here.</h2><p>Turn something you have learned, noticed, or imagined into a story someone else needs.</p></div><Link className="write-button" to={isAuthenticated ? user?.role === "Author" ? "/dashboard?tab=create" : "/blogs" : "/register"}>{isAuthenticated ? user?.role === "Author" ? "Write a story" : "Explore the journal" : "Start your writing journey"}<FiArrowUpRight aria-hidden="true" /></Link></motion.section>
  </main>;
}
