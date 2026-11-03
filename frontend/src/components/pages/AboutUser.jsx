import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiEdit3, FiUser } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { BackendUrl } from "../../assets/frontendConstants";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";
import MyProfile from "../miniComponents/MyProfile";
import "../../studio.css";

export default function AboutUser() {
  const { isAuthenticated, isAuthLoading, user, setUser } = useContext(Context);
  const [requesting, setRequesting] = useState(false);
  const navigate = useNavigate();

  async function requestAuthorAccess() {
    if (requesting) return;
    setRequesting(true);
    try {
      const { data } = await axios.post(`${BackendUrl}/api/v1/user/author-access`, {}, { withCredentials: true });
      setUser(data.user);
      toast.success(data.message);
      navigate("/dashboard?tab=create");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "We couldn't enable author access. Please try again."));
    } finally {
      setRequesting(false);
    }
  }
  let content;

  if (isAuthLoading) {
    content = (
      <output className="studio-loading">
        <span className="studio-spinner" />Loading your account...
      </output>
    );
  } else if (isAuthenticated) {
    content = <>
      <MyProfile showAuthorLink={user.role === "Author"} />
      <div className="studio-insight-note">
        <FiEdit3 aria-hidden="true" />
        <div><strong>{user.role === "Author" ? "Your author workspace" : "Become an author"}</strong><p>{user.role === "Author" ? "Your stories and drafts are waiting in Studio." : "Author access is enabled immediately. Keep your account and start sharing stories."}</p></div>
        {user.role === "Author" ? <Link className="text-link" to="/dashboard">Switch to author <FiArrowRight aria-hidden="true" /></Link> : <button className="text-link" type="button" onClick={requestAuthorAccess} disabled={requesting} aria-busy={requesting}><FiEdit3 aria-hidden="true" />{requesting ? "Enabling access..." : "Request author access"}</button>}
      </div>
    </>;
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