import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRegUser } from "react-icons/fa";
import api from "../utils/axiosInstance";
import { clearUser, getUser } from "../utils/tokenService";
import { Button } from "./ui";
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
            <Button variant="ghost" size="sm" onClick={() => navigate(backPath)}>
              <FaArrowLeft /> Back
            </Button>
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth?mode=login")}>
              Log In
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/auth?mode=signup")}>
              Sign Up
            </Button>
          </>
        )}

        {(variant === "app" || variant === "inner") && (
          user ? (
            <>
              <Button variant="icon" onClick={() => navigate("/profile")} title="Profile">
                <FaRegUser />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth?mode=login")}>
                Log In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate("/auth?mode=signup")}>
                Sign Up
              </Button>
            </>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;
