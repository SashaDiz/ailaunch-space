import React from "react";
import { Link } from "react-router-dom";
import { Plane, Twitter, Github, Mail } from "lucide-react";
import logoWhite from "@/assets/logo-white.svg";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="block mb-4">
              <img src={logoWhite} alt="Directory Hunt Logo" className="h-10" />
            </Link>
            <p className="text-gray-400 mb-4">
              Directory Hunt is a platform to discover and submit directories
              for developers and tech enthusiasts. Made by{" "}
              <a
                href="https://x.com/johnrushx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline underline-offset-4"
              >
                John Rush
              </a>
              .
            </p>
            <div className="flex space-x-4">
              <a
                to="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                to="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                to="mailto:hello@travellaunch.com"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/submit"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Submit App
                </Link>
              </li>
              <li>
                <Link
                  to="/past-launches"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Past Launches
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Directory Hunt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
