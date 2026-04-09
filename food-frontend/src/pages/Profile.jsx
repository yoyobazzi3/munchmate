import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth?mode=login");
  };

  return (
    <div className="profile-page">
      <div className="profile-nav">
        <button className="back-btn" onClick={() => navigate("/home")}>
          <FaArrowLeft /> Back
        </button>
        <span className="profile-nav-title">Profile</span>
      </div>

      <div className="profile-container">
        <div className="profile-avatar">
          <img src="/default-avatar.svg" alt="Avatar" />
        </div>

        <h2 className="profile-name">{user.firstName} {user.lastName}</h2>
        <p className="profile-email">{user.email}</p>

        <div className="profile-card">
          <div className="profile-field">
            <span className="field-label">First Name</span>
            <span className="field-value">{user.firstName}</span>
          </div>
          <div className="profile-field">
            <span className="field-label">Last Name</span>
            <span className="field-value">{user.lastName}</span>
          </div>
          <div className="profile-field">
            <span className="field-label">Email</span>
            <span className="field-value">{user.email}</span>
          </div>
        </div>

        <button className="logout-btn-profile" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Profile;
