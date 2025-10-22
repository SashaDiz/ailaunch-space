import React from "react";
import Link from "next/link";
import { Twitter, Github, Mail } from "iconoir-react";
import Image from "next/image";
import { NewsletterSignup } from "./NewsletterSignup";
import { SocialFollow } from "./SocialShare";

export function Footer() {
  return (
    <footer className="bg-slate-900">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/">
              <Image
                src="/assets/logo-white.svg"
                alt="AI Launch Space"
                height={48}
                width={48}
                priority
                style={{ width: "auto", height: "48px" }}
              />
            </Link>
            <p className="text-white/70 text-sm">
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
            <h3 className="font-semibold text-lg mb-4 text-white leading-none">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/projects"
                  className="text-white/70 hover:text-[#ED0D79] transition-colors"
                >
                  Browse AI Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="text-white/70 hover:text-[#ED0D79] transition-colors"
                >
                  Submit AI Project
                </Link>
              </li>
              {/* temporarily hidden
              <li>
                <Link
                  href="/pricing"
                  className="text-white/70 hover:text-[#ED0D79] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              */}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white leading-none">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="text-white/70 hover:text-[#ED0D79] transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-white/70 hover:text-[#ED0D79] transition-colors"
                >
                  FAQs
                </Link>
              </li>
              {/* CHANGELOG FEATURE DISABLED - COMMENTED OUT FOR FUTURE DEVELOPMENT
              <li>
                <Link
                  href="/changelog"
                  className="text-white/70 hover:text-[#ED0D79] transition-colors"
                >
                  Changelog
                </Link>
              </li>
              */}
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
            <p className="text-white/70 text-sm">
              © 2025 AI Launch Space. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/terms"
                className="text-white/70 hover:text-[#ED0D79] transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-white/70 hover:text-[#ED0D79] transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/cookies"
                className="text-white/70 hover:text-[#ED0D79] transition-colors"
              >
                Cookies
              </Link>
              <Link
                href="/contact"
                className="text-white/70 hover:text-[#ED0D79] transition-colors"
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
