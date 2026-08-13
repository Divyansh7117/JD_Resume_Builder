import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10 md:w-11 md:h-11",
    lg: "w-14 h-14 md:w-16 md:h-16",
    xl: "w-20 h-20 md:w-24 md:h-24",
  };

  const textMap = {
    sm: "text-lg",
    md: "text-xl md:text-2xl",
    lg: "text-2xl md:text-3xl",
    xl: "text-3xl md:text-4xl",
  };

  return (
    <div className={`inline-flex items-center gap-3 group cursor-pointer ${className}`}>
      {/* PNG Logo Image from /public/logo.png */}
      <img
        src="/logo.png"
        alt="JD Resume Logo"
        className={`${sizeMap[size]} object-contain rounded-xl shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-all duration-200`}
      />

      {showText && (
        <span className={`font-heading font-extrabold text-white tracking-tight flex items-center gap-1.5 ${textMap[size]}`}>
          JD <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3654FF] to-[#1F9D6B]">→</span> Resume
        </span>
      )}
    </div>
  );
}
