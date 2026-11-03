import { useContext, useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown, FiEdit3, FiLogOut, FiMenu, FiMoon, FiSun, FiUser, FiX } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { AppName, BackendUrl } from "../../assets/frontendConstants";
import { Context } from "../../main";

const navigation = [["Discover", "/blogs"], ["Writers", "/authors"], ["About", "/about"]];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState(null);
  const accountRef = useRef(null);
  const { mode, setMode, isAuthenticated, user, setIsAuthenticated, setUser } = useContext(Context);
  const isAuthor = user?.role === "Author";
  const avatarUrl = user?.avatar?.url;
  const initial = user?.name?.trim().charAt(0).toUpperCase() || "R";
  const nextTheme = mode === "dark" ? "light" : "dark";
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const closeMenu = () => {
    setMenuOpen(false);
    if (accountRef.current) accountRef.current.open = false;
  };

  function toggleNavigation() {
    if (accountRef.current) accountRef.current.open = false;
    setMenuOpen(!menuOpen);
  }

  useEffect(() => {
    function dismissAccount(event) {
      const account = accountRef.current;
      if (!account?.open) return;
      if (event.type === "keydown") {
        if (event.key !== "Escape") return;
        account.open = false;
        account.querySelector("summary")?.focus();
      } else if (!account.contains(event.target)) {
        account.open = false;
      }
    }
    document.addEventListener("pointerdown", dismissAccount);
    document.addEventListener("keydown", dismissAccount);
    return () => {
      document.removeEventListener("pointerdown", dismissAccount);
      document.removeEventListener("keydown", dismissAccount);
    };
  }, []);

  useEffect(() => {
    if (accountRef.current) accountRef.current.open = false;
  }, [pathname]);

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { data } = await axios.get(`${BackendUrl}/api/v1/user/logout`, { withCredentials: true });
      if (data.success) {
        setIsAuthenticated(false);
        setUser({});
        closeMenu();
        toast.success(data.message);
        void navigate("/");
      }
    } catch {
      toast.error("We couldn't sign you out. Please try again.");
    } finally {
      setSigningOut(false);
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
          {isAuthenticated && isAuthor && <NavLink to="/dashboard" onClick={closeMenu} className="nav-link">Studio</NavLink>}
          {!isAuthenticated && <NavLink to="/login" onClick={closeMenu} className="nav-link mobile-auth-link">Sign in</NavLink>}
        </div>
        <div className="nav-actions">
          {isAuthenticated ? <details className="account-dropdown" ref={accountRef} onToggle={(event) => { if (event.currentTarget.open) setMenuOpen(false); }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}>
            <summary className="account-trigger" aria-label="Account"><span className="nav-avatar" aria-hidden="true">{initial}{avatarUrl && failedAvatar !== avatarUrl && <img key={avatarUrl} src={avatarUrl} alt="" onError={() => setFailedAvatar(avatarUrl)} />}</span><span className="account-trigger-label">Account</span><FiChevronDown className="account-chevron" aria-hidden="true" /></summary>
            <div className="account-panel">
              <div className="account-identity"><strong>{user?.name || "Your account"}</strong><span>{user?.role}</span></div>
              <NavLink to="/aboutUser" onClick={closeMenu}><FiUser aria-hidden="true" />My profile</NavLink>
              {isAuthor ? <NavLink to="/dashboard" onClick={closeMenu}><FiEdit3 aria-hidden="true" />Open Author Studio</NavLink> : <NavLink to="/aboutUser" onClick={closeMenu}><FiEdit3 aria-hidden="true" />Become an author</NavLink>}
              <button type="button" onClick={() => setMode(nextTheme)}>{mode === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}Switch to {nextTheme} theme</button>
              <button className="account-signout" type="button" onClick={handleLogout} disabled={signingOut}><FiLogOut aria-hidden="true" />{signingOut ? "Signing out..." : "Sign out"}</button>
            </div>
          </details> : <>
            <button className="icon-button theme-toggle" type="button" onClick={() => setMode(nextTheme)} aria-label={`Switch to ${nextTheme} theme`} title="Toggle theme">{mode === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}</button>
            <NavLink className="sign-in-link" to="/login">Sign in</NavLink>
            <NavLink className="write-button" to="/register"><FiEdit3 aria-hidden="true" /> Start writing</NavLink>
          </>}
          <button className="icon-button mobile-menu-button" type="button" onClick={toggleNavigation} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}>{menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}</button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;