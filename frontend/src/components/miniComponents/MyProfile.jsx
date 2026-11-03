import { useContext } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiMail, FiShield, FiUser } from "react-icons/fi";
import { Context } from "../../main";

export default function MyProfile({ showAuthorLink = true }) {
  const { user } = useContext(Context);
  const created = user.createdOn ? new Date(user.createdOn) : null;
  const joined = created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "Not available";
  return <><div className="studio-page-heading"><div><span className="section-kicker">YOUR IDENTITY</span><h1>Your account</h1><p>The person behind the stories. Your profile and account details.</p></div>{showAuthorLink && <Link className="studio-button secondary" to={`/author/${user._id}`}>View author profile <FiArrowUpRight aria-hidden="true" /></Link>}</div><div className="studio-profile-grid"><section className="studio-panel studio-profile-card"><div className="studio-profile-cover" /><div className="studio-profile-avatar">{user.avatar?.url ? <img src={user.avatar.url} alt={user.name} /> : <FiUser aria-hidden="true" />}</div><h2>{user.name}</h2><span className="studio-status published"><span />{user.role}</span><p>Your words, your perspective.<br />Part of the OpenBlogs community.</p><div className="studio-profile-email"><FiMail aria-hidden="true" />{user.email}</div></section><section className="studio-panel"><div className="studio-panel-heading"><span className="studio-step"><FiShield aria-hidden="true" /></span><div><h2>Account details</h2><p>Information provided when you joined OpenBlogs.</p></div></div><dl className="studio-account-details">{[["Full name", user.name], ["Email address", user.email], ["Phone number", user.phone], ["Education", user.education], ["Account type", user.role], ["Member since", joined]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}</dl><p className="studio-account-note">These are your registered account details. Your email and phone number are shown here for your reference.</p></section></div></>;
}
