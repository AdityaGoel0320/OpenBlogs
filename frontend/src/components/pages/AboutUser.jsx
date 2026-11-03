import { useContext } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiUser } from "react-icons/fi";
import { Context } from "../../main";
import MyProfile from "../miniComponents/MyProfile";
import "../../studio.css";

export default function AboutUser() {
  const { isAuthenticated, isAuthLoading } = useContext(Context);
  let content;

  if (isAuthLoading) {
    content = (
      <output className="studio-loading">
        <span className="studio-spinner" />Loading your account...
      </output>
    );
  } else if (isAuthenticated) {
    content = <MyProfile showAuthorLink={false} />;
  } else {
    content = (
      <section className="studio-empty" aria-labelledby="about-user-title">
        <span className="studio-empty-icon"><FiUser aria-hidden="true" /></span>
        <h1 id="about-user-title">Your account, all in one place.</h1>
        <p>Sign in to see your OpenBlogs profile and account details.</p>
        <Link className="studio-button" to="/login">Sign in <FiArrowRight aria-hidden="true" /></Link>
      </section>
    );
  }

  return <main className="studio-main about-user-page">{content}</main>;
}