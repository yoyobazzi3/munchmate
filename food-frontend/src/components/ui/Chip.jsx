import "./Chip.css";

/**
 * Chip — toggleable tag or read-only label.
 *
 * selected   filled with brand color when true (default false)
 * readOnly   display-only chip; no hover state, no cursor pointer (default false)
 * variant    "default" | "price"
 *   price    wider padding + square-ish border-radius for $ $$ $$$ $$$$ buttons
 */
const Chip = ({
  selected = false,
  readOnly = false,
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const classes = [
    "ui-chip",
    selected ? "ui-chip--selected" : "",
    readOnly ? "ui-chip--readonly" : "",
    variant === "price" ? "ui-chip--price" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (readOnly) {
    return <span className={classes} {...props}>{children}</span>;
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Chip;
