import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { Context } from "../../main";
import { StoryEngagement, WriterSelect } from "../miniComponents/WriterElements";
import "../../writers.css";

function BlogDirectory() {
  const { blogs } = useContext(Context);
  const [selectedCategory, setSelectedCategory] = useState("All topics");
  const [query, setQuery] = useState("");
  const categories = useMemo(() => ["All topics", ...new Set(blogs.map((blog) => blog.category).filter(Boolean))], [blogs]);
  const filteredBlogs = useMemo(() => blogs.filter((blog) => {
    const matchesCategory = selectedCategory === "All topics" || blog.category === selectedCategory;
    const searchableText = `${blog.title} ${blog.authorName} ${blog.category} ${blog.intro}`.toLowerCase();
    return matchesCategory && searchableText.includes(query.trim().toLowerCase());
  }), [blogs, query, selectedCategory]);

  return <main className="directory-page">
    <div className="directory-heading">
      <span className="section-kicker">Independent voices, one place</span>
      <h1>Find your next <em>good read.</em></h1>
      <p>Browse ideas, perspectives, and stories from the OpenBlogs community.</p>
    </div>
    <div className="directory-toolbar">
      <label className="search-field"><FiSearch aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories, writers, topics..." aria-label="Search stories, writers, and topics" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><FiX aria-hidden="true" /></button>}
      </label>
      <WriterSelect label="Topic" value={selectedCategory} onChange={setSelectedCategory} options={categories.map((category) => ({ value: category, label: category }))} />
    </div>
    <div className="directory-results"><span>{filteredBlogs.length} {filteredBlogs.length === 1 ? "story" : "stories"}</span><span>Curated by the community</span></div>
    {filteredBlogs.length ? <div className="story-grid directory-grid">{filteredBlogs.map((blog, index) => <Link to={`/blog/${blog._id}`} className="story-card" key={blog._id} style={{ "--story-order": index }}>
      <div className="story-image-wrap"><img className="story-image" src={blog.mainImage?.url} alt="" loading="lazy" /><span className="category-label">{blog.category}</span></div>
      <div className="story-card-copy"><h3>{blog.title}</h3><p>{blog.intro}</p><div className="story-byline"><img src={blog.authorAvatar} alt="" loading="lazy" /><span>{blog.authorName}</span><span className="byline-dot" /><span>{Math.max(1, Math.ceil((blog.intro?.split(/\s+/).length || 0) / 200))} min read</span></div><StoryEngagement community={blog.community} /></div>
    </Link>)}</div> : <div className="empty-state search-empty"><h2>No stories found</h2><p>Try a different search or choose another topic.</p><button className="text-link" type="button" onClick={() => { setQuery(""); setSelectedCategory("All topics"); }}>Clear filters <span aria-hidden="true">↗</span></button></div>}
  </main>;
}

export default BlogDirectory;