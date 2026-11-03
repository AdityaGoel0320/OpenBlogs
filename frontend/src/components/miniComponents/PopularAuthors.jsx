import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowUp, FiArrowUpRight, FiAward, FiStar } from "react-icons/fi";
import { BackendUrl } from "../../assets/frontendConstants";
import { WriterAvatar, WritersState } from "./WriterElements";
import { Context } from "../../main";
import { rankWriters } from "../../assets/useWriters";
import "../../writers.css";

const PopularAuthors = () => {
  const { blogs } = useContext(Context);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchAuthors = async () => {
      try {
        const { data } = await axios.get(`${BackendUrl}/api/v1/user/authors`, { withCredentials: true });
        if (active) setAuthors(data.authors || []);
      } catch {
        if (active) setAuthors([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchAuthors();
    return () => { active = false; };
  }, []);

  let writersContent;
  if (loading) {
    writersContent = <WritersState loading />;
  } else if (authors.length === 0) {
    writersContent = <WritersState title="A community waiting for its first voice." description="Writer profiles will appear here as people join OpenBlogs. In the meantime, explore the journal." />;
  } else {
    writersContent = <div className="writers-card-grid home-writers-grid">
      {rankWriters(authors, blogs || []).slice(0, 4).map(({ author, reputation, rank }) => <article className="writers-card" key={author._id}>
        <div className="writers-card-top"><span className="writers-card-label"><FiAward aria-hidden="true" />{rank ? `#${rank} in the community` : "OpenBlogs writer"}</span><FiArrowUpRight aria-hidden="true" /></div>
        <WriterAvatar author={author} />
        <h3><Link to={`/author/${author._id}`}>{author.name}</Link></h3>
        <p>A voice in the OpenBlogs community, sharing ideas and experiences worth exploring.</p>
        <div className="writers-engagement"><span><FiArrowUp aria-hidden="true" />{reputation.upvoteCount} upvotes</span><span><FiStar aria-hidden="true" />{reputation.ratingCount ? `${reputation.averageRating.toFixed(1)} (${reputation.ratingCount})` : "Unrated"}</span></div>
        <div className="writers-topic-tags"><span>Independent perspective</span></div>
        <div className="writers-card-bottom"><span>Meet the writer</span><Link to={`/author/${author._id}`} className="text-link" aria-label={`View ${author.name}'s profile`}>View profile <FiArrowRight aria-hidden="true" /></Link></div>
      </article>)}
    </div>;
  }

  return <section className="writers-page home-writers" aria-labelledby="home-writers-title">
    <div className="writers-section-heading">
      <div>
        <span className="section-kicker">People behind the pages</span>
        <h2 id="home-writers-title">Meet the writers</h2>
        <p>Discover the voices and perspectives shaping our community.</p>
      </div>
      <Link className="text-link" to="/authors">All writers <FiArrowRight aria-hidden="true" /></Link>
    </div>
    {writersContent}
  </section>;
};

export default PopularAuthors;
