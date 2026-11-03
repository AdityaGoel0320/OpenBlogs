import { useContext, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiEdit3, FiLogOut, FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { AppName, BackendUrl } from "../../assets/frontendConstants";
import { Context } from "../../main";

const navigation = [["Discover", "/blogs"], ["Writers", "/authors"], ["About", "/about"]];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { mode, setMode, isAuthenticated, user, setIsAuthenticated, setUser } = useContext(Context);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      const { data } = await axios.get(`${BackendUrl}/api/v1/user/logout`, { withCredentials: true });
      if (data.success) {
        setIsAuthenticated(false);
        setUser({});
        toast.success(data.message);
        navigate("/");
      }
    } catch {
      toast.error("We couldn't sign you out. Please try again.");
    }
  };

  if (pathname === "/dashboard" || pathname.startsWith("/blog/update/")) return null;

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Main navigation">
        <NavLink className="brand" to="/" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true">o</span>
          <span>{AppName}<small>Stories worth sharing</small></span>
        </NavLink>
        <div className={`nav-links${menuOpen ? " nav-links-open" : ""}`}>
          {navigation.map(([label, path]) => <NavLink key={path} to={path} onClick={closeMenu} className={({ isActive }) => isActive ? "nav-link nav-link-active" : "nav-link"}>{label}</NavLink>)}
          {isAuthenticated && user?.role === "Author" && <NavLink to="/dashboard" onClick={closeMenu} className="nav-link">Studio</NavLink>}
          {!isAuthenticated && <NavLink to="/login" onClick={closeMenu} className="nav-link mobile-auth-link">Sign in</NavLink>}
          {isAuthenticated && <button type="button" onClick={handleLogout} className="nav-link mobile-auth-link mobile-logout-link">Sign out</button>}
        </div>
        <div className="nav-actions">
          <button className="icon-button theme-toggle" type="button" onClick={() => setMode(mode === "dark" ? "light" : "dark")} aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} theme`} title="Toggle theme">{mode === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}</button>
          {isAuthenticated ? <>
            {user?.role !== "Author" && <NavLink className="nav-avatar" to="/aboutUser" aria-label="Your profile">{user?.name?.slice(0, 1) || "R"}</NavLink>}
            <button className="icon-button logout-button" type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out"><FiLogOut aria-hidden="true" /></button>
          </> : <>
            <NavLink className="sign-in-link" to="/login">Sign in</NavLink>
            <NavLink className="write-button" to="/register"><FiEdit3 aria-hidden="true" /> Start writing</NavLink>
          </>}
          <button className="icon-button mobile-menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}>{menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}</button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;