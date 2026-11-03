import { useContext, useState } from "react";
import PropTypes from "prop-types";
import { Link, Navigate, useLocation } from "react-router-dom";
import { FiArrowUpRight, FiBarChart2, FiBookOpen, FiEdit3, FiGrid, FiLogOut, FiMoon, FiSun, FiUser } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { BackendUrl } from "../../assets/frontendConstants";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";
import "../../studio.css";

const navigation = [
  ["overview", "Overview", FiGrid],
  ["stories", "My stories", FiBookOpen],
  ["create", "Write a story", FiEdit3],
  ["analytics", "Insights", FiBarChart2],
  ["profile", "Account", FiUser],
];

export default function StudioLayout({ active, children, hasUnsavedChanges = false }) {
  const { user, mode, setMode, isAuthenticated, isAuthLoading, setIsAuthenticated, setUser } = useContext(Context);
  const [signingOut, setSigningOut] = useState(false);
  const { pathname, search } = useLocation();

  function confirmLeaving() {
    return !hasUnsavedChanges || window.confirm("Leave the editor? Your unsaved changes will be lost.");
  }
  function guardNavigation(event) {
    const link = event.target.closest("a[href]");
    if (link && link.getAttribute("href") !== `${pathname}${search}` && !event.ctrlKey && !event.metaKey && !event.shiftKey && !confirmLeaving()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  async function logout() {
    if (!confirmLeaving()) return;
    setSigningOut(true);
    try {
      const { data } = await axios.get(`${BackendUrl}/api/v1/user/logout`, { withCredentials: true });
      setIsAuthenticated(false);
      setUser({});
      toast.success(data.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "We couldn't sign you out. Please try again."));
    } finally {
      setSigningOut(false);
    }
  }

  if (isAuthLoading) return <div className="route-loading" role="status">Opening your workspace...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role !== "Author") return <Navigate to="/aboutUser" replace />;

  return (
    <div className="studio" onClickCapture={guardNavigation}>
      <aside className="studio-sidebar">
        <Link className="brand studio-brand" to="/"><span className="brand-mark" aria-hidden="true">o</span><span>OpenBlogs<small>AUTHOR STUDIO</small></span></Link>
        <div className="studio-workspace"><span className="studio-avatar">{user.name?.slice(0, 1)}</span><div><strong>{user.name}</strong><small>Personal workspace</small></div></div>
        <span className="studio-nav-label">WORKSPACE</span>
        <nav className="studio-navigation" aria-label="Studio navigation">
          {navigation.map(([key, label, Icon]) => <Link key={key} to={`/dashboard?tab=${key}`} className={`studio-nav-item${active === key ? " is-active" : ""}`} aria-current={active === key ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span>{active === key && <span className="studio-nav-dot" />}</Link>)}
        </nav>
        <div className="studio-sidebar-note"><FiEdit3 aria-hidden="true" /><strong>Your next story starts here.</strong><p>A small idea can become something worth sharing.</p><Link to="/dashboard?tab=create">Make it a story <FiArrowUpRight aria-hidden="true" /></Link></div>
        <div className="studio-sidebar-bottom"><Link to="/" className="studio-nav-item"><FiBookOpen aria-hidden="true" />Switch to reader</Link><button type="button" className="studio-nav-item" onClick={logout} disabled={signingOut}><FiLogOut aria-hidden="true" />{signingOut ? "Signing out..." : "Sign out"}</button></div>
      </aside>
      <div className="studio-body">
        <header className="studio-topbar"><div className="studio-breadcrumb">Workspace <span>/</span> <strong>{active === "edit" ? "Edit story" : navigation.find(([key]) => key === active)?.[1]}</strong></div><div className="studio-topbar-actions"><Link to="/" className="icon-button" aria-label="Switch to reader" title="Switch to reader"><FiBookOpen aria-hidden="true" /></Link><button type="button" className="icon-button" onClick={() => setMode(mode === "dark" ? "light" : "dark")} aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} theme`}>{mode === "dark" ? <FiSun /> : <FiMoon />}</button><Link to="/dashboard?tab=profile" className="studio-avatar" aria-label="Your account">{user.avatar?.url ? <img src={user.avatar.url} alt="" /> : user.name?.slice(0, 1)}</Link><button type="button" className="icon-button studio-mobile-logout" onClick={logout} disabled={signingOut} aria-label={signingOut ? "Signing out" : "Sign out"}><FiLogOut aria-hidden="true" /></button></div></header>
        <main className="studio-main" id="studio-content">{children}</main>
        <footer className="studio-footer"><span>OpenBlogs Studio</span><span>A space for your ideas. A home for your stories.</span></footer>
      </div>
    </div>
  );
}

StudioLayout.propTypes = { active: PropTypes.string.isRequired, children: PropTypes.node.isRequired, hasUnsavedChanges: PropTypes.bool };
