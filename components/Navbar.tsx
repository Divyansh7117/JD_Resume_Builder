"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useAuth,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Logo from "@/components/Logo";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "How it Works", href: "/how-it-works" },
    { name: "Templates", href: "/templates" },
    { name: "FAQ", href: "/faq" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0F1419]/90 backdrop-blur-md border-b border-[#1C2333]">
      {/* Bottom glowing border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3654FF]/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 h-18 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Logo />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#3654FF]/10 text-[#3654FF] border border-[#3654FF]/20 font-semibold"
                      : "text-[#9CA3AF] hover:text-white hover:bg-[#161B22]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            {isSignedIn && (
              <Link
                href="/dashboard"
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  pathname === "/dashboard"
                    ? "bg-[#3654FF]/10 text-[#3654FF] border border-[#3654FF]/20 font-semibold"
                    : "text-[#9CA3AF] hover:text-white hover:bg-[#161B22]"
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          <div className="h-4 w-px bg-[#1C2333]" />

          {/* Auth Controls */}
          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <button className="text-xs font-medium text-[#9CA3AF] hover:text-white transition-colors cursor-pointer px-3 py-1.5">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="text-xs font-heading font-semibold bg-gradient-to-r from-[#3654FF] to-[#5B73FF] hover:from-[#2A44E0] hover:to-[#4A62FF] text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-500/20 cursor-pointer">
                    Get Started Free
                  </button>
                </SignUpButton>
              </>
            ) : (
              <>
                <Link
                  href="/app"
                  className="text-xs font-heading font-semibold bg-gradient-to-r from-[#3654FF] to-[#5B73FF] hover:from-[#2A44E0] hover:to-[#4A62FF] text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-500/20"
                >
                  Workspace →
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8 ring-2 ring-[#3654FF]/30",
                    },
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-3 md:hidden">
          {isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8",
                },
              }}
            />
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#9CA3AF] hover:text-white focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F1419] border-b border-[#1C2333] px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[#9CA3AF] hover:text-white font-medium py-1"
            >
              {link.name}
            </Link>
          ))}
          {isSignedIn && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[#9CA3AF] hover:text-white font-medium py-1"
            >
              Dashboard
            </Link>
          )}
          <div className="h-px bg-[#1C2333] my-1" />
          {!isSignedIn ? (
            <div className="flex flex-col gap-3">
              <SignInButton mode="modal">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-sm text-[#9CA3AF] hover:text-white font-medium py-2 border border-[#1C2333] rounded-lg"
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-medium bg-[#3654FF] text-white py-2 rounded-lg"
                >
                  Get Started
                </button>
              </SignUpButton>
            </div>
          ) : (
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center text-sm font-medium bg-[#3654FF] text-white py-2 rounded-lg"
            >
              Go to Workspace
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
