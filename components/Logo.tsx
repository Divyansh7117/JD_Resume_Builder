import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "w-7 h-7 md:w-8 md:h-8",
    md: "w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11",
    lg: "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16",
    xl: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
  };

  const textMap = {
    sm: "text-base md:text-lg",
    md: "text-base sm:text-xl md:text-2xl",
    lg: "text-xl sm:text-2xl md:text-3xl",
    xl: "text-2xl sm:text-3xl md:text-4xl",
  };

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-3 group cursor-pointer max-w-full ${className}`}>
      {/* PNG Logo Image from /public/logo.png */}
      <img
        src="/logo.png"
        alt="JD Resume Logo"
        className={`${sizeMap[size]} object-contain rounded-xl shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-all duration-200 shrink-0`}
      />

      {showText && (
        <span className={`font-heading font-extrabold text-white tracking-tight flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${textMap[size]}`}>
          JD <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3654FF] to-[#1F9D6B]">→</span> Resume
        </span>
      )}
    </div>
  );
}
