import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { AppName } from "../../assets/FrontendUtils";

function AuthLayout({ children, page }) {
  return (
    <main className={`auth-page auth-page-${page}`}>
      <div className="auth-layout">
        <aside className="auth-story-panel">
          <Link className="auth-brand" to="/" aria-label={`${AppName} home`}>
            <span className="brand-mark" aria-hidden="true">o</span>
            <span>
              {AppName}
              <small>Stories worth sharing</small>
            </span>
          </Link>
          <div className="auth-story-copy">
            <span className="section-kicker">A home for your next chapter</span>
            <h1>Good ideas deserve a place to grow.</h1>
            <p>
              Find your people, follow your curiosity, and make room for the
              stories only you can tell.
            </p>
          </div>
          <div className="auth-story-note">
            <span className="auth-note-mark" aria-hidden="true">“</span>
            <p>Read with curiosity. Write with purpose. Share what matters.</p>
            <span>THE OPENBLOGS COMMUNITY</span>
          </div>
        </aside>
        <section className="auth-panel" aria-label={page === "login" ? "Sign in" : "Create an account"}>
          {children}
        </section>
      </div>
    </main>
  );
}

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  page: PropTypes.oneOf(["login", "register"]).isRequired,
};

export default AuthLayout;
