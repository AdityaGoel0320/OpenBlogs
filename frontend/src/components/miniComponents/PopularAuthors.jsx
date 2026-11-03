import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { BackendUrl } from "../../assets/frontendConstants";
import { WriterCard, WritersState } from "./WriterElements";
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
      {rankWriters(authors, blogs || []).slice(0, 4).map((writer) => <WriterCard key={writer.author._id} {...writer} />)}
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
