function Button({ type = "button", visual = "button", onClick, children }) {
  return (
    <button
      type={type}
      className={visual === "button" ? "btn-button" : "btn-link"}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;