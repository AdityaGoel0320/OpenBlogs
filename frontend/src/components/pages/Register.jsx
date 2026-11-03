import { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiArrowRight, FiImage, FiUser } from "react-icons/fi";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { BackendUrl } from "../../assets/frontendConstants";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";
import AvatarCropper from "../auth/AvatarCropper";
import AuthLayout from "../auth/AuthLayout";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MIN_AVATAR_DIMENSION = 256;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [education, setEducation] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cropFile, setCropFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState("");
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(avatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatar]);

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setFormError("Choose a JPG, PNG, or WebP image for your avatar.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setFormError("That image is larger than 5 MB. Choose a smaller photo.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      if (image.naturalWidth < MIN_AVATAR_DIMENSION || image.naturalHeight < MIN_AVATAR_DIMENSION) {
        setFormError("Your image must be at least 256 × 256 pixels so it stays clear when cropped.");
        return;
      }

      setFormError("");
      setCropFile(file);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      setFormError("We couldn't read that image. Choose a valid JPG, PNG, or WebP file.");
    };
    image.src = imageUrl;
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!avatar) {
      setFormError("Add and crop a profile photo before creating your account.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim().toLowerCase());
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("education", education);
    formData.append("role", role);
    formData.append("avatar", avatar, "avatar.jpg");

    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      const { data } = await axios.post(
        `${BackendUrl}/api/v1/user/register`,
        formData,
        {
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
            }
          },
        }
      );
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success(data.message || "Your account is ready.");
      navigate("/");
    } catch (error) {
      const message = getApiErrorMessage(error, "We couldn't create your account. Please check your details and try again.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthLayout page="register">
      <div className="auth-card auth-card-register">
        <div className="auth-card-heading">
          <span className="section-kicker">Join the conversation</span>
          <h2>Create your account</h2>
          <p>One account for thoughtful reading and stories worth sharing.</p>
        </div>
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-avatar-picker">
            <div className="auth-avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Cropped profile photo preview" />
              ) : (
                <FiUser aria-hidden="true" />
              )}
            </div>
            <div className="auth-avatar-copy">
              <strong>Profile photo</strong>
              <span>Square crop · JPG, PNG, or WebP · up to 5 MB</span>
              <label className="auth-upload-button">
                <FiImage aria-hidden="true" />
                {avatar ? "Change photo" : "Choose a photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  disabled={isSubmitting}
                  aria-label="Choose a profile photo"
                />
              </label>
            </div>
          </div>
          <div className="auth-form-grid">
            <label className="auth-field">
              <span>Your name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="How should we call you?"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={3}
                maxLength={32}
                required
              />
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
              <span>Phone number</span>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                inputMode="numeric"
                pattern="[0-9]{7,15}"
                title="Enter 7 to 15 digits"
                placeholder="7–15 digits"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 15))}
                required
              />
            </label>
            <label className="auth-field">
              <span>Your role</span>
              <select value={role} onChange={(event) => setRole(event.target.value)} required>
                <option value="" disabled>Select a role</option>
                <option value="Reader">Reader</option>
                <option value="Author">Author</option>
              </select>
            </label>
            <label className="auth-field">
              <span>Education</span>
              <select value={education} onChange={(event) => setEducation(event.target.value)} required>
                <option value="" disabled>Select your education</option>
                <option value="Matric">Matric</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Graduation">Graduation</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
              </select>
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={32}
                required
              />
            </label>
          </div>
          {avatarPreview && (
            <div className="auth-avatar-ready" role="status">
              <span className="auth-avatar-ready-dot" />
              Photo cropped and ready to upload
            </div>
          )}
          {formError && <p className="auth-error" role="alert">{formError}</p>}
          {isSubmitting && (
            <div className="auth-upload-progress" role="status" aria-live="polite">
              <div className="auth-upload-progress-copy">
                <span>{uploadProgress >= 100 ? "Finishing your account..." : "Uploading securely..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div
                className="auth-progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={uploadProgress}
              >
                <span style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          <button className="auth-primary-button auth-submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><span className="auth-spinner" /> Creating account...</> : <>Create account <FiArrowRight aria-hidden="true" /></>}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onApply={(croppedFile) => {
            setAvatar(croppedFile);
            setCropFile(null);
            setFormError("");
          }}
        />
      )}
    </AuthLayout>
  );
};

export default Register;
