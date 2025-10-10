import React from "react";
import Link from "next/link";
import { Twitter, Github, Mail } from "iconoir-react";
import Image from "next/image";
import { NewsletterSignup } from "./NewsletterSignup";
import { SocialFollow } from "./SocialShare";

export function Footer() {
  return (
    <footer className="bg-base-200">
      <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold">AI Launch Space</span>
            </div>
            <p className="text-base-content/70 text-sm">
              The ultimate weekly competition platform for AI builders to launch, compete,
              and grow their audience.
            </p>
            <SocialFollow
              variant="horizontal"
              size="md"
              className="flex space-x-3"
            />
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/directories"
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  Browse AI Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  Submit AI Project
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/past-launches"
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  Past Launches
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  API Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterSignup
              variant="footer"
              source="footer"
              placeholder="your@email.com"
              buttonText="Subscribe"
            />
          </div>
        </div>

        <div className="border-t border-base-300 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-base-content/60 text-sm">
              © 2025 AI Launch Space. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/terms"
                className="text-base-content/60 hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-base-content/60 hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/cookies"
                className="text-base-content/60 hover:text-primary transition-colors"
              >
                Cookies
              </Link>
              <Link
                href="/contact"
                className="text-base-content/60 hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
