import { Link } from "react-router-dom";
import { useContext } from "react";
import { Context } from "../../main";
import { StoryEngagement } from "./WriterElements";

function FeaturedStory() {
  const { blogs } = useContext(Context);
  const blog = blogs?.[0];
  if (!blog) {
    return <section className="hero-section"><div className="featured-empty">
      <span className="eyebrow"><span className="eyebrow-dot" /> A space for every point of view</span>
      <h1>Good ideas deserve <em>a wider audience.</em></h1>
      <p>Discover thoughtful stories from independent writers, or publish something of your own.</p>
      <Link className="write-button" to="/blogs">Explore stories <span aria-hidden="true">↗</span></Link>
    </div></section>;
  }

  return <section className="hero-section"><Link className="featured-story" to={`/blog/${blog._id}`} style={{ "--story-image": `url("${blog.mainImage?.url || ""}")` }}>
    <div className="featured-copy">
      <span className="eyebrow"><span className="eyebrow-dot" /> Editor&apos;s pick <span className="eyebrow-divider">/</span> {blog.category}</span>
      <h1>{blog.title}</h1>
      <p className="featured-intro">{blog.intro}</p>
      <span className="featured-byline"><img src={blog.authorAvatar} alt="" /><span>By <strong>{blog.authorName}</strong></span><span className="read-link">Read story <span aria-hidden="true">↗</span></span></span>
      <StoryEngagement community={blog.community} />
    </div>
    <span className="featured-index" aria-hidden="true">01</span>
  </Link></section>;
}

export default FeaturedStory;