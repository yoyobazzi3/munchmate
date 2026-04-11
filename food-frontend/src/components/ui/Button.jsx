import "./Button.css";

/**
 * Button — shared button primitive.
 *
 * variant  "primary" | "ghost" | "danger" | "icon"
 *   primary  filled orange — main CTAs (Save, Apply, Sign In)
 *   ghost    outline — secondary actions (Clear, Back, Sign Out)
 *   danger   outline that fills on hover — destructive actions (Log Out)
 *   icon     circle icon button (profile avatar, close buttons)
 *
 * size     "sm" | "md" | "lg"  (default "md")
 * fullWidth  stretches to 100% width of its container
 */
const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}) => {
  const classes = [
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    fullWidth ? "ui-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
