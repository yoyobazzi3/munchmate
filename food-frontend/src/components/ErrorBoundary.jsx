import { Component } from "react";
import { Button } from "./ui";
import { ROUTES } from "../utils/routes";
import "./ErrorBoundary.css";

/**
 * ErrorBoundary — class component that catches render/lifecycle errors in its
 * subtree and shows a fallback UI instead of a blank / broken screen.
 *
 * Props:
 *   variant   "page" (default) | "inline"
 *             "page"   — full-screen centred card, used at the app/route level
 *             "inline" — compact strip, used inside a section or widget
 *   fallback  Optional ReactNode or render-prop ({ error, reset }) => ReactNode
 *             When provided it completely overrides the built-in fallback UI.
 *   onReset   Optional callback fired when the user clicks "Try again".
 *   children  The subtree to guard.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Invoked during render — updates state so the next render shows the fallback. */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /** Invoked after the error is caught — good place to send logs to a service. */
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  /** Resets boundary state so children can re-render. */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, variant = "page" } = this.props;

    if (!hasError) return children;

    // ── Custom fallback (render-prop or static node) ──────────────────────────
    if (fallback) {
      return typeof fallback === "function"
        ? fallback({ error, reset: this.handleReset })
        : fallback;
    }

    // ── Inline variant — compact, for widgets / cards ─────────────────────────
    if (variant === "inline") {
      return (
        <div className="eb-inline" role="alert">
          <span className="eb-inline__icon">⚠️</span>
          <p className="eb-inline__msg">Something went wrong.</p>
          <button className="eb-inline__retry" onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }

    // ── Page variant — full-screen card, for app / route level ────────────────
    return (
      <div className="eb-page" role="alert">
        <div className="eb-page__card">
          <span className="eb-page__emoji">🍽️</span>
          <h1 className="eb-page__title">Something went wrong</h1>
          <p className="eb-page__msg">
            An unexpected error occurred. You can try refreshing the page or
            heading back home.
          </p>
          {import.meta.env.DEV && error && (
            <pre className="eb-page__detail">{error.message}</pre>
          )}
          <div className="eb-page__actions">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
            <Button variant="ghost" onClick={() => { window.location.href = ROUTES.HOME; }}>
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
