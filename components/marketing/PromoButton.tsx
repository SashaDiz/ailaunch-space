import React from "react";

const PromoButton = ({ href, onClick, children, className = "", target, rel, disabled }: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
}) => {
  const baseClasses = "block text-center bg-background text-foreground border-2 border-foreground rounded-lg py-3 font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none";
  
  if (href) {
    return (
      <a
        href={href}
        target={target || "_blank"}
        rel={rel || "noopener noreferrer"}
        className={`${baseClasses} ${className}`}
      >
        {children}
      </a>
    );
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default PromoButton;
