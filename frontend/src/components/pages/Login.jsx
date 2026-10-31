import { useContext, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { BackendUrl } from "../../assets/FrontendUtils";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";
import AuthLayout from "../auth/AuthLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const { data } = await axios.post(
        `${BackendUrl}/api/v1/user/login`,
        { email: email.trim(), password, role },
        { withCredentials: true }
      );
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success(data.message || "Welcome back.");
      navigate("/");
    } catch (error) {
      const message = getApiErrorMessage(error, "We couldn't sign you in. Please try again.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthLayout page="login">
      <div className="auth-card">
        <div className="auth-card-heading">
          <span className="section-kicker">Welcome back</span>
          <h2>Sign in to your account</h2>
          <p>Pick up where you left off and get back to the stories you love.</p>
        </div>
        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-field">
            <span>Your role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              autoComplete="organization-title"
              required
            >
              <option value="" disabled>Select reader or author</option>
              <option value="Reader">Reader</option>
              <option value="Author">Author</option>
            </select>
          </label>
          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <span className="auth-password-wrap">
              <FiLock aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </span>
          </label>
          {formError && <p className="auth-error" role="alert">{formError}</p>}
          <button className="auth-primary-button auth-submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><span className="auth-spinner" /> Signing in...</> : <>Sign in <FiArrowRight aria-hidden="true" /></>}
          </button>
        </form>
        <p className="auth-switch">
          New to OpenBlogs? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
