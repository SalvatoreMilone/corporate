import React from "react";

const ShinyText = ({ text, disabled = false, speed = 5, className = "" }) => {
  return (
    <div className={`relative inline-block text-transparent ${className}`}>
      {/* Testo statico */}
      <span className="text-[#b5b5b5a4] absolute">{text}</span>

      {/* Testo con effetto shine */}
      {!disabled && (
        <span
          className="relative bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 100%)",
            backgroundSize: "200% 100%",
            backgroundPosition: "right",
            WebkitBackgroundClip: "text",
            animation: `shine ${speed}s linear infinite`,
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default ShinyText;
