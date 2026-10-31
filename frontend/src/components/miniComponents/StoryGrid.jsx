import { Link } from "react-router-dom";
import { useContext } from "react";
import { Context } from "../../main";

function StoryGrid() {
  const { blogs = [] } = useContext(Context);
  const stories = blogs.slice(1, 6);
  return <section className="story-section">
    <div className="section-heading">
      <div><span className="section-kicker">The OpenBlogs journal</span><h2>Latest stories</h2></div>
      <Link className="text-link" to="/blogs">View all stories <span aria-hidden="true">↗</span></Link>
    </div>
    {stories.length ? <div className="story-grid">{stories.map((blog, index) => <Link to={`/blog/${blog._id}`} className="story-card" key={blog._id} style={{ "--story-order": index }}>
      <div className="story-image-wrap"><img className="story-image" src={blog.mainImage?.url} alt="" loading="lazy" /><span className="category-label">{blog.category}</span></div>
      <div className="story-card-copy"><h3>{blog.title}</h3><p>{blog.intro}</p><div className="story-byline"><img src={blog.authorAvatar} alt="" loading="lazy" /><span>{blog.authorName}</span><span className="byline-dot" /><span>{Math.max(1, Math.ceil((blog.intro?.split(/\s+/).length || 0) / 200))} min read</span></div></div>
    </Link>)}</div> : <p className="empty-state">No published stories yet. Check back soon.</p>}
  </section>;
}

export default StoryGrid;