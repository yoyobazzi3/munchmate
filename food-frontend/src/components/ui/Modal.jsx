import { useEffect } from "react";
import "./Modal.css";

/**
 * Modal — base overlay + content container.
 *
 * Handles:
 *  - Dark semi-transparent overlay with backdrop blur
 *  - Slide-up entrance animation
 *  - Escape key to close
 *  - Body scroll lock while open
 *  - Click-outside-to-close (click the overlay)
 *
 * onClose   called on Escape key or overlay click
 * maxWidth  CSS max-width for the content panel (default "900px")
 *
 * The close button and modal content are provided by the consumer via children.
 */
const Modal = ({ onClose, maxWidth = "900px", children }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div
        className="ui-modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
