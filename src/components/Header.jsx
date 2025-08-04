import React from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logoSvg from "@/assets/logo.svg";

// Placeholder for authentication state
const isAuthenticated = false; // Replace with real auth logic

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold text-gray-900"
          >
            <img src={logoSvg} alt="Directory Hunt Logo" className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/past-launches"
              className="font-medium text-gray-900 transition duration-300 animated-underline"
            >
              Past Launches
            </Link>
            <Link
              to="/faq"
              className="font-medium text-gray-900 transition duration-300 animated-underline"
            >
              How It Works
            </Link>
            <Link
              to="/pricing"
              className="font-medium text-gray-900 transition duration-300 animated-underline"
            >
              Pricing
            </Link>
          </nav>

          {/* Submit Button & Auth Buttons & Mobile Menu */}
          <div className="flex items-center space-x-2">
            {!isAuthenticated && (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/submit"
                  className="flex items-center gap-1.5 leading-0 font-semibold text-gray-900 transition duration-300 mr-4 submit-button group hover:bg-gray-100 rounded-lg px-4 py-3.5"
                >
                  <svg
                    width="20px"
                    height="20px"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    color="#111827"
                    className="transition-transform duration-300 group-hover:rotate-90"
                  >
                    <path
                      d="M8 12H12M16 12H12M12 12V8M12 12V16"
                      stroke="#111827"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#111827"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Submit Directory
                </Link>
                <Link to="/signin">
                  <Button className="px-6 mt-0" variant={"default"}>
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/past-launches"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Past Launches
              </Link>
              <Link
                to="/faq"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                to="/pricing"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="pt-2 mt-2 border-t border-gray-200 space-y-2">
                <Link to="/submit" onClick={() => setIsMenuOpen(false)}>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                    Submit App
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                    <Link to="/signin" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
