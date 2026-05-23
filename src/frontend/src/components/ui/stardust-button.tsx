import type React from "react";

interface StardustButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: unknown;
}

export const StardustButton = ({
  children = "Launching Soon",
  onClick,
  className = "",
  ...props
}: StardustButtonProps) => {
  const buttonStyle: React.CSSProperties = {
    outline: "none",
    cursor: "pointer",
    border: 0,
    position: "relative",
    borderRadius: "100px",
    backgroundColor: "#0a1929",
    transition: "all 0.2s ease",
    boxShadow: `
      inset 0 0.3rem 0.9rem rgba(255, 255, 255, 0.3),
      inset 0 -0.1rem 0.3rem var(--btn-overlay-dark),
      inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.5),
      0 3rem 3rem rgba(0, 0, 0, 0.3),
      0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)
    `,
  };

  const wrapStyle: React.CSSProperties = {
    fontSize: "25px",
    fontWeight: 500,
    color: "rgba(129, 216, 255, 0.9)",
    padding: "32px 45px",
    borderRadius: "inherit",
    position: "relative",
    overflow: "hidden",
  };

  const pStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: 0,
    transition: "all 0.2s ease",
    transform: "translateY(2%)",
    maskImage:
      "linear-gradient(to bottom, rgba(129, 216, 255, 1) 40%, transparent)",
    WebkitMaskImage:
      "linear-gradient(to bottom, rgba(129, 216, 255, 1) 40%, transparent)",
  };

  return (
    <>
      <style>{`
        .pearl-btn-wrap::before {
          content: "";
          position: absolute;
          left: -15%;
          right: -15%;
          bottom: 25%;
          top: -100%;
          border-radius: 50%;
          background-color: var(--btn-glow-bg);
          transition: all 0.3s ease;
        }
        .pearl-btn-wrap::after {
          content: "";
          position: absolute;
          left: 6%;
          right: 6%;
          top: 12%;
          bottom: 40%;
          border-radius: 22px 22px 0 0;
          box-shadow: inset 0 10px 8px -10px rgba(129, 216, 255, 0.6);
          background: linear-gradient(180deg, var(--btn-glow-bg) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 100%);
          transition: all 0.3s ease;
        }
        .pearl-btn .pearl-btn-text-2 { display: none; }
        .pearl-btn:hover .pearl-btn-text-1 { display: none; }
        .pearl-btn:hover .pearl-btn-text-2 { display: inline-block; }
        .pearl-btn:hover { box-shadow: inset 0 0.3rem 0.5rem var(--btn-glow-border), inset 0 -0.1rem 0.3rem var(--btn-overlay-dark), inset 0 -0.4rem 0.9rem rgba(64, 180, 255, 0.6), 0 3rem 3rem rgba(0,0,0,0.3), 0 1rem 1rem -0.6rem var(--btn-overlay-dark); }
        .pearl-btn:hover .pearl-btn-wrap::before { transform: translateY(-5%); }
        .pearl-btn:hover .pearl-btn-wrap::after { opacity: 0.4; transform: translateY(5%); }
        .pearl-btn:hover .pearl-btn-p { transform: translateY(-4%); }
        .pearl-btn:active { transform: translateY(4px); }
      `}</style>
      <button
        type="button"
        className={`pearl-btn ${className}`}
        style={buttonStyle}
        onClick={onClick}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <div className="pearl-btn-wrap" style={wrapStyle}>
          <p className="pearl-btn-p" style={pStyle}>
            <span className="pearl-btn-text-1">✧</span>
            <span className="pearl-btn-text-2">✦</span>
            {children}
          </p>
        </div>
      </button>
    </>
  );
};

export default StardustButton;
