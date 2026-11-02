import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiImage, FiSave, FiSend } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { BackendUrl } from "../../assets/FrontendUtils";
import { getApiErrorMessage } from "../../assets/apiErrorMessage";

const sections = ["paraOne", "paraTwo", "paraThree"];
const textFields = ["title", "intro", "category", ...sections.flatMap((section) => [`${section}Title`, `${section}Description`])];

function ImageField({ name, title, preview, required, onChange }) {
  return <label className={`studio-upload${preview ? " has-image" : ""}`}><span className="studio-field-label">{title}{!required && <small>Optional</small>}</span>{preview ? <img src={preview} alt={`${title} preview`} /> : <span className="studio-upload-placeholder"><FiImage aria-hidden="true" /><strong>Add an image</strong><span>JPG, PNG or WebP</span></span>}<input type="file" name={name} accept="image/jpeg,image/png,image/webp" required={required && !preview} onChange={onChange} /><small>{preview ? "Choose a file to replace this image." : "Choose an image from your device."}</small></label>;
}
ImageField.propTypes = { name: PropTypes.string.isRequired, title: PropTypes.string.isRequired, preview: PropTypes.string, required: PropTypes.bool, onChange: PropTypes.func.isRequired };

export default function StoryEditor({ blog, onSaved, onDirtyChange }) {
  const [values, setValues] = useState(() => Object.fromEntries(textFields.map((field) => [field, blog?.[field] || ""])));
  const [published, setPublished] = useState(blog?.published ?? true);
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState(() => Object.fromEntries(["mainImage", ...sections.map((section) => `${section}Image`)].map((field) => [field, blog?.[field]?.url || ""])));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    function warn(event) {
      if (dirty) { event.preventDefault(); event.returnValue = ""; }
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setDirty(true);
  }
  function selectImage(field, event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("We couldn't read this image. Please choose it again.");
    reader.onload = () => {
      setFiles((current) => ({ ...current, [field]: file }));
      setPreviews((current) => ({ ...current, [field]: reader.result }));
      setDirty(true);
    };
    reader.readAsDataURL(file);
  }
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const form = new FormData();
    textFields.forEach((field) => form.append(field, values[field]));
    form.append("published", published);
    Object.entries(files).forEach(([field, file]) => form.append(field, file));
    try {
      const url = `${BackendUrl}/api/v1/blog/${blog ? `update/${blog._id}` : "post"}`;
      const { data } = await axios({ method: blog ? "put" : "post", url, data: form, withCredentials: true });
      setDirty(false);
      toast.success(data.message);
      onSaved(data.blog);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "We couldn't save your story. Your changes are still here; please try again."));
    } finally {
      setSaving(false);
    }
  }
  function cancel() {
    if (!dirty || window.confirm("Leave the editor? Your unsaved changes will be lost.")) navigate("/dashboard?tab=stories");
  }
  const words = [values.intro, ...sections.map((section) => values[`${section}Description`])].join(" ").trim().split(/\s+/).filter(Boolean).length;
  const checklist = [["Story title", Boolean(values.title.trim())], ["Topic selected", Boolean(values.category)], ["Cover image", Boolean(previews.mainImage)], ["Introduction (250+ characters)", values.intro.length >= 250]];
  return (
    <>
      <button className="text-link studio-back" type="button" onClick={cancel}><FiArrowLeft aria-hidden="true" />Back to stories</button>
      <div className="studio-page-heading"><div><span className="section-kicker">THE WRITING ROOM</span><h1>{blog ? "Refine your story." : "Make your idea a story."}</h1><p>Start with a title, set the scene, and let your perspective do the rest.</p></div><span className="studio-editor-state">{dirty ? "Unsaved changes" : blog ? "Saved story" : "New story"}<span />{words} words</span></div>
      <form className="studio-editor" onSubmit={save}>
        <fieldset className="studio-editor-fields" disabled={saving}>
          <section className="studio-panel"><div className="studio-panel-heading"><span className="studio-step">01</span><div><h2>Set the scene</h2><p>The essentials that help readers discover your story.</p></div></div>
            <label className="studio-field"><span>Story title</span><input required value={values.title} onChange={(event) => update("title", event.target.value)} placeholder="Give your story a compelling title" /></label>
            <label className="studio-field"><span id="story-topic-label">Topic</span><select aria-labelledby="story-topic-label" required value={values.category} onChange={(event) => update("category", event.target.value)}><option value="">Choose a topic</option>{["Lifestyle", "Technology", "Sports", "Travel", "Business", "Economy"].map((topic) => <option key={topic}>{topic}</option>)}</select></label>
            <ImageField name="mainImage" title="Cover image" preview={previews.mainImage} required onChange={(event) => selectImage("mainImage", event)} />
            <label className="studio-field"><span id="story-intro-label">Introduction</span><textarea aria-labelledby="story-intro-label" aria-describedby="story-intro-help" required minLength={250} rows={7} value={values.intro} onChange={(event) => update("intro", event.target.value)} placeholder="Draw your readers in. What's the story you want to tell?" /><small id="story-intro-help">{values.intro.length} characters / 250 minimum. Required for both drafts and published stories.</small></label>
          </section>
          <section className="studio-panel"><div className="studio-panel-heading"><span className="studio-step">02</span><div><h2>Tell your story</h2><p>Add up to three optional sections to develop your ideas.</p></div></div>{sections.map((section, index) => <details className="studio-editor-section" key={section} open={index === 0 || undefined}><summary><span>Section {index + 1}</span><small>{values[`${section}Title`] || "Optional chapter"}</small></summary><div><label className="studio-field"><span>Section heading</span><input value={values[`${section}Title`]} onChange={(event) => update(`${section}Title`, event.target.value)} placeholder="Introduce this part of your story" /></label><label className="studio-field"><span>Body</span><textarea rows={7} value={values[`${section}Description`]} onChange={(event) => update(`${section}Description`, event.target.value)} placeholder="Keep the story going..." /></label><ImageField name={`${section}Image`} title={`Section ${index + 1} image`} preview={previews[`${section}Image`]} onChange={(event) => selectImage(`${section}Image`, event)} /></div></details>)}</section>
        </fieldset>
        <aside className="studio-editor-aside">
          <section className="studio-panel"><h2>Ready when you are</h2><p>Choose how you want to save your story.</p><label className="studio-field"><span id="story-visibility-label">Visibility</span><select aria-labelledby="story-visibility-label" value={published ? "published" : "draft"} onChange={(event) => { setPublished(event.target.value === "published"); setDirty(true); }} disabled={saving}><option value="published">Published - visible to everyone</option><option value="draft">Draft - not shown in the feed</option></select></label><ul className="studio-checklist">{checklist.map(([label, complete]) => <li key={label} className={complete ? "complete" : ""}><span>{complete && <FiCheck aria-hidden="true" />}</span>{label}</li>)}</ul><button className="studio-button" type="submit" disabled={saving}>{saving ? <><span className="studio-spinner" />Saving story...</> : <>{published ? <FiSend aria-hidden="true" /> : <FiSave aria-hidden="true" />}{published ? blog ? "Save & publish" : "Publish story" : "Save draft"}</>}</button><button className="studio-button secondary" type="button" disabled={saving} onClick={cancel}>Cancel</button><small>Changes are saved only when you press the save or publish button.</small></section>
          <div className="studio-editor-tip"><span className="section-kicker">A NOTE FOR THE WRITER</span><p>Write like yourself.<br />That is what makes it worth reading.</p></div>
        </aside>
      </form>
    </>
  );
}
StoryEditor.propTypes = { blog: PropTypes.object, onSaved: PropTypes.func.isRequired, onDirtyChange: PropTypes.func };
