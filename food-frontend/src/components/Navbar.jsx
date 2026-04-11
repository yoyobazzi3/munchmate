import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRegUser } from "react-icons/fa";
import api from "../utils/axiosInstance";
import { clearUser, getUser } from "../utils/tokenService";
import "./Navbar.css";

/**
 * Shared Navbar component
 *
 * Props:
 *  variant: "landing" | "app" | "inner"
 *    - landing: Logo + nav links + Login/Sign Up (public)
 *    - app:     Logo + nav links + Profile + Sign Out (authenticated home)
 *    - inner:   Logo + back button + page title + Profile icon (secondary pages)
 *
 *  title:    Page title shown in "inner" variant
 *  backPath: Where the back button navigates (default: "/home")
 *  navLinks: Array of { label, href } for in-page anchor scrolling
 */
const Navbar = ({
  variant = "app",
  title = "",
  backPath = "/home",
  navLinks = [],
}) => {
  const navigate = useNavigate();

  // Presence of user info in localStorage indicates an active session
  const user = getUser();

  const handleSignOut = async () => {
    try {
      // Ask the backend to clear the HttpOnly token cookies
      await api.post("/logout");
    } finally {
      clearUser();
      navigate("/");
    }
  };

  return (
    <nav className="shared-nav">
      {/* Left: Logo or Back + Title */}
      <div className="shared-nav__left">
        {variant === "inner" ? (
          <>
            <button className="shared-nav__back" onClick={() => navigate(backPath)}>
              <FaArrowLeft /> Back
            </button>
            {title && <span className="shared-nav__title">{title}</span>}
          </>
        ) : (
          <div
            className="shared-nav__logo"
            onClick={() => navigate(variant === "landing" ? "/" : "/home")}
            role="button"
            tabIndex={0}
          >
            <img src="/logo.png" alt="MunchMate" />
            <span>MunchMate</span>
          </div>
        )}
      </div>

      {/* Center: Nav links */}
      {navLinks.length > 0 && (
        <div className="shared-nav__links">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Right: Auth actions */}
      <div className="shared-nav__right">
        {variant === "landing" && (
          <>
            <button
              className="shared-nav__btn shared-nav__btn--ghost"
              onClick={() => navigate("/auth?mode=login")}
            >
              Log In
            </button>
            <button
              className="shared-nav__btn shared-nav__btn--solid"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Sign Up
            </button>
          </>
        )}

        {(variant === "app" || variant === "inner") && (
          user ? (
            <>
              <button
                className="shared-nav__icon-btn"
                onClick={() => navigate("/profile")}
                title="Profile"
              >
                <FaRegUser />
              </button>
              <button
                className="shared-nav__btn shared-nav__btn--ghost"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                className="shared-nav__btn shared-nav__btn--ghost"
                onClick={() => navigate("/auth?mode=login")}
              >
                Log In
              </button>
              <button
                className="shared-nav__btn shared-nav__btn--solid"
                onClick={() => navigate("/auth?mode=signup")}
              >
                Sign Up
              </button>
            </>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;
