import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRegUser, FaRegHeart, FaBars, FaTimes } from "react-icons/fa";
import { logout } from "../services/authService";
import { useUser } from "../hooks/useUser";
import { ROUTES, AUTH_ROUTES } from "../utils/routes";
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
  const { user, logoutUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      logoutUser();
      navigate(ROUTES.HOME);
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
            onClick={() => navigate(ROUTES.HOME)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(ROUTES.HOME)}
            aria-label="Go to home"
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

      {/* Right: Auth actions + hamburger */}
      <div className="shared-nav__right">
        {variant === "landing" && (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate(AUTH_ROUTES.LOGIN)}>
              Log In
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate(AUTH_ROUTES.SIGNUP)}>
              Sign Up
            </Button>
          </>
        )}

        {(variant === "app" || variant === "inner") && (
          user ? (
            <>
              <Button variant="icon" onClick={() => navigate(ROUTES.FAVORITES)} title="Saved restaurants">
                <FaRegHeart />
              </Button>
              <Button variant="icon" onClick={() => navigate(ROUTES.PROFILE)} title="Profile">
                <FaRegUser />
              </Button>
              <Button variant="ghost" size="sm" className="shared-nav__signout" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(AUTH_ROUTES.LOGIN)}>
                Log In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate(AUTH_ROUTES.SIGNUP)}>
                Sign Up
              </Button>
            </>
          )
        )}

        {/* Hamburger — mobile only */}
        <button className="shared-nav__hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="shared-nav__mobile-menu">
          <button onClick={() => { navigate(ROUTES.HOME); closeMenu(); }}>Home</button>
          <button onClick={() => { navigate(ROUTES.RESTAURANTS); closeMenu(); }}>Restaurants</button>
          {user && <button onClick={() => { navigate(ROUTES.CHATBOT); closeMenu(); }}>AI Chatbot</button>}
          {user && <button onClick={() => { navigate(ROUTES.FAVORITES); closeMenu(); }}>Favorites</button>}
          {user && <button onClick={() => { navigate(ROUTES.PROFILE); closeMenu(); }}>Profile</button>}
          {user
            ? <button onClick={() => { handleSignOut(); closeMenu(); }}>Sign Out</button>
            : <>
                <button onClick={() => { navigate(AUTH_ROUTES.LOGIN); closeMenu(); }}>Log In</button>
                <button onClick={() => { navigate(AUTH_ROUTES.SIGNUP); closeMenu(); }}>Sign Up</button>
              </>
          }
        </div>
      )}
    </nav>
  );
};

export default Navbar;
