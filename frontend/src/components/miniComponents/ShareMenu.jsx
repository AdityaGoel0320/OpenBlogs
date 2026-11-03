import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useReducedMotion } from "framer-motion";
import { FiCheck, FiCopy, FiInstagram, FiLinkedin, FiShare2, FiTwitter, FiX } from "react-icons/fi";

export default function ShareMenu({ open, onClose, title, url }) {
  const dialogRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const linkedin = new URL("https://www.linkedin.com/sharing/share-offsite/");
  linkedin.searchParams.set("url", url);
  const twitter = new URL("https://twitter.com/intent/tweet");
  twitter.searchParams.set("url", url);
  twitter.searchParams.set("text", title);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open) {
      if (!dialog.open) return;
      const timer = setTimeout(() => dialog.close(), reducedMotion ? 0 : 220);
      return () => clearTimeout(timer);
    }
    const previousOverflow = document.body.style.overflow;
    setCopied(false);
    setMessage("");
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open, reducedMotion]);

  async function copyLink(forInstagram = false) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMessage(forInstagram ? "Link copied. Paste it into your Instagram message or story." : "Story link copied to clipboard.");
    } catch {
      setMessage("Copying is unavailable. Select and copy the story link below.");
    }
  }

  function dismissBackdrop(event) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }

  return <dialog className="story-share-dialog" ref={dialogRef} data-closing={!open} aria-labelledby="story-share-title" aria-describedby="story-share-story" onCancel={(event) => { event.preventDefault(); onClose(); }} onClose={(event) => { if (!event.currentTarget.open) onClose(); }} onClick={dismissBackdrop}>
    <div className="story-share-heading"><span className="story-share-mark"><FiShare2 aria-hidden="true" /></span><button className="story-share-close" type="button" onClick={onClose} aria-label="Close share menu" title="Close share menu"><FiX aria-hidden="true" /></button></div>
    <h2 id="story-share-title">Share this story</h2>
    <p id="story-share-story">{title}</p>
    <div className="story-share-options">
      <a href={linkedin.href} target="_blank" rel="noopener noreferrer"><FiLinkedin aria-hidden="true" /><span>LinkedIn<small>Share with your network</small></span></a>
      <a href={twitter.href} target="_blank" rel="noopener noreferrer"><FiTwitter aria-hidden="true" /><span>Twitter / X<small>Post this perspective</small></span></a>
      <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" onClick={() => { void copyLink(true); }}><FiInstagram aria-hidden="true" /><span>Instagram<small>Copy link and open Instagram</small></span></a>
      <button type="button" onClick={() => { void copyLink(); }}>{copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}<span>{copied ? "Link copied" : "Copy link"}<small>Copy to clipboard</small></span></button>
    </div>
    <label className="story-share-link"><span>Story link</span><input type="text" readOnly value={url} onFocus={(event) => event.target.select()} /></label>
    <output className="story-share-status" aria-live="polite">{message}</output>
  </dialog>;
}

ShareMenu.propTypes = { open: PropTypes.bool.isRequired, onClose: PropTypes.func.isRequired, title: PropTypes.string.isRequired, url: PropTypes.string.isRequired };