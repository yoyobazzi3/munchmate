import "./Spinner.css";

/**
 * Spinner — animated loading indicator.
 *
 * size  "sm" (16px) | "md" (24px) | "lg" (36px)  default "md"
 */
const Spinner = ({ size = "md", className = "" }) => (
  <div className={`ui-spinner ui-spinner--${size} ${className}`.trim()} />
);

export default Spinner;
