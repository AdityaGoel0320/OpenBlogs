import { FiArrowUpRight, FiMail } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Email } from "../../assets/FrontendUtils";

function ContactBand() {
  return <section className="contact-band">
    <span className="section-kicker">Make room for another voice</span>
    <h2>Have a story worth sharing?</h2>
    <p>Join independent writers sharing ideas, experience, and points of view with the community.</p>
    <div className="contact-actions">
      <Link className="write-button" to="/register">Become a writer <FiArrowUpRight aria-hidden="true" /></Link>
      <a className="text-link" href={`mailto:${Email}`}><FiMail aria-hidden="true" /> Contact the team</a>
    </div>
  </section>;
}

export default ContactBand;