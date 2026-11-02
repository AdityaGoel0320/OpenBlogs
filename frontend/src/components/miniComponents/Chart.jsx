import { useContext } from "react";
import PropTypes from "prop-types";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBarChart2 } from "react-icons/fi";
import { Context } from "../../main";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Chart({ blogs }) {
  const { mode } = useContext(Context);
  const published = blogs.filter((blog) => blog.published).length;
  const drafts = blogs.length - published;
  const categories = Object.entries(blogs.reduce((counts, blog) => ({ ...counts, [blog.category]: (counts[blog.category] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const rate = blogs.length ? Math.round(published / blogs.length * 100) : 0;
  const data = { labels: ["Published", "Drafts"], datasets: [{ data: [published, drafts], backgroundColor: [mode === "dark" ? "#42b6c5" : "#087e8b", mode === "dark" ? "#344653" : "#dce5e9"], borderWidth: 0, hoverOffset: 5 }] };
  return blogs.length ? <><div className="studio-insights-grid"><section className="studio-panel"><div className="studio-section-heading"><div><h2>Publishing balance</h2><p>From work in progress to words in the world.</p></div></div><div className="studio-chart"><Doughnut data={data} options={{ cutout: "78%", maintainAspectRatio: false, plugins: { legend: { display: false } } }} role="img" aria-label={`${published} published stories and ${drafts} drafts`} /><div className="studio-chart-center"><strong>{rate}%</strong><span>published</span></div></div><div className="studio-chart-legend"><span><i />Published <strong>{published}</strong></span><span><i />Drafts <strong>{drafts}</strong></span></div></section><section className="studio-panel"><h2>Topics you explore</h2><p>The subjects that make up your story library.</p><div className="studio-topic-list">{categories.map(([category, count]) => <div key={category}><div><strong>{category}</strong><span>{count} {count === 1 ? "story" : "stories"}</span></div><div className="studio-topic-track"><span style={{ width: `${count / blogs.length * 100}%` }} /></div></div>)}</div></section></div><div className="studio-insight-note"><FiBarChart2 aria-hidden="true" /><div><strong>Your library, not vanity metrics.</strong><p>These insights reflect your saved stories and publishing status. OpenBlogs does not currently track readership or engagement.</p></div><Link className="text-link" to="/dashboard?tab=stories">Manage stories <FiArrowRight aria-hidden="true" /></Link></div></> : <div className="studio-empty"><span className="studio-empty-icon"><FiBarChart2 aria-hidden="true" /></span><h2>A fresh start, ready for your stories</h2><p>Your publishing breakdown and topics will appear once you save your first story.</p><Link className="studio-button" to="/dashboard?tab=create">Write a story <FiArrowRight aria-hidden="true" /></Link></div>;
}
Chart.propTypes = { blogs: PropTypes.array.isRequired };
