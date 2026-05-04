import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaRegUser, FaHome, FaUtensils, FaCommentDots, FaRegHeart } from "react-icons/fa";
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
 *    - landing: Logo + Login/Sign Up (public)
 *    - app:     Logo + icon nav links + Profile + Sign Out (authenticated)
 *    - inner:   Back button + page title + Profile icon (secondary pages)
 *
 *  title:    Page title shown in "inner" variant
 *  backPath: Where the back button navigates (default: "/")
 */
const Navbar = ({
  variant = "app",
  title = "",
  backPath = "/",
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logoutUser } = useUser();

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      logoutUser();
      navigate(ROUTES.HOME);
    }
  };

  const isActive = (path) => {
    const base = path.split("?")[0];
    if (base === "/") return pathname === "/";
    return pathname === base || pathname.startsWith(base + "/");
  };

  // Desktop center nav — shown for app variant when authenticated
  const centerLinks = [
    { label: "Explore",   icon: <FaUtensils />,   path: ROUTES.RESTAURANTS },
    { label: "AI Chat",   icon: <FaCommentDots />, path: ROUTES.CHATBOT    },
    { label: "Favorites", icon: <FaRegHeart />,    path: ROUTES.FAVORITES  },
  ];

  // Mobile bottom tab bar tabs
  const authTabs = [
    { label: "Home",    icon: <FaHome />,        path: ROUTES.HOME        },
    { label: "Explore", icon: <FaUtensils />,    path: ROUTES.RESTAURANTS },
    { label: "AI Chat", icon: <FaCommentDots />, path: ROUTES.CHATBOT     },
    { label: "Profile", icon: <FaRegUser />,     path: ROUTES.PROFILE     },
  ];

  const guestTabs = [
    { label: "Home",    icon: <FaHome />,     path: ROUTES.HOME        },
    { label: "Explore", icon: <FaUtensils />, path: ROUTES.RESTAURANTS },
    { label: "Log In",  icon: <FaRegUser />,  path: AUTH_ROUTES.LOGIN  },
  ];

  const tabs = user ? authTabs : guestTabs;
  const showBottomTab = variant === "app" || variant === "inner";

  return (
    <>
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

        {/* Center: Icon + label route links (desktop, app + authenticated) */}
        {variant === "app" && user && (
          <div className="shared-nav__links">
            {centerLinks.map((link) => (
              <button
                key={link.label}
                className={`shared-nav__link${isActive(link.path) ? " shared-nav__link--active" : ""}`}
                onClick={() => navigate(link.path)}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right: Auth actions */}
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
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      {showBottomTab && (
        <nav className="bottom-tab-bar" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              className={`bottom-tab${isActive(tab.path) ? " bottom-tab--active" : ""}`}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
            >
              <span className="bottom-tab__icon">{tab.icon}</span>
              <span className="bottom-tab__label">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
};

export default Navbar;
