import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BackendUrl } from "../../assets/FrontendUtils";

const PopularAuthors = () => {
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

    fetchAuthors();
    return () => { active = false; };
  }, []);

  return <section className="popularAuthors">
    <div className="section-heading">
      <div><span className="section-kicker">People behind the pages</span><h2>Meet the writers</h2></div>
      <Link className="text-link" to="/authors">All writers <span aria-hidden="true">↗</span></Link>
    </div>
    {authors.length > 0 && <div className="author-grid">{authors.slice(0, 4).map((author) => <article className="author-card" key={author._id}>
      <img src={author.avatar?.url} alt="" loading="lazy" />
      <h3>{author.name}</h3>
      <Link className="author-profile-link" to={`/author/${author._id}`}>View profile <span aria-hidden="true">↗</span></Link>
    </article>)}</div>}
    {loading && <p className="author-status" role="status">Finding writers...</p>}
    {!loading && authors.length === 0 && <p className="empty-state">Writer profiles will appear here as the community grows.</p>}
  </section>;
};

export default PopularAuthors;
