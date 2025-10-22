"use client";

import React, { useState, useEffect } from "react";
import {
  ShareIos,
  X,
  Linkedin,
  Link,
  Check,
  Copy,
  Github,
} from "iconoir-react";
import toast from "react-hot-toast";

export function SocialShare({
  projectId,
  slug,
  title,
  description,
  url,
  hashtags = [],
  className = "",
  variant = "default", // default, minimal, floating
  size = "md", // sm, md, lg
}) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const shareUrl = url || (isClient ? window.location.href : "");
  const shareTitle = title || "Check out this AI project on AI Launch Space!";
  const shareDescription =
    description || "Discover amazing AI projects and tools on AI Launch Space";
  const shareHashtags =
    hashtags.length > 0 ? hashtags : ["AILaunchSpace", "AI", "ArtificialIntelligence"];

  const shareData = {
    url: shareUrl,
    title: shareTitle,
    description: shareDescription,
    hashtags: shareHashtags,
  };

  const handleShare = async (platform, customUrl = null) => {
    try {
      // Track the share
      if (projectId || slug) {
        // Analytics removed
      }

      const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareTitle)}&hashtags=${shareHashtags.join(
          ","
        )}`,
        linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
          shareTitle + " - " + shareDescription + " " + shareUrl
        )}`,
      };

      if (customUrl) {
        window.open(customUrl, "_blank", "width=600,height=400");
      } else if (shareUrls[platform]) {
        const popup = window.open(
          shareUrls[platform],
          "_blank",
          "width=600,height=400"
        );

        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          // Fallback: copy link to clipboard
          toast.error("Popup blocked. Link copied to clipboard instead!");
          await navigator.clipboard.writeText(shareUrl);
          return;
        }

        toast.success(
          `Sharing on ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`
        );
      }
    } catch (error) {
      console.error("Failed to share on platform:", { platform, error });
      toast.error(`Failed to share on ${platform}. Please try again.`);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");

      // Track copy action
      if (projectId || slug) {
        // Analytics removed
      }

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Check what's supported
        const shareData = {
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        };

        // Check if sharing is supported for this data
        if (navigator.canShare && !navigator.canShare(shareData)) {
          // Fallback to copy link
          await handleCopyLink();
          return;
        }

        await navigator.share(shareData);

        // Track native share
        if (projectId || slug) {
          // Analytics removed
        }

        toast.success("Shared successfully!");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Native share failed:", error);
          // Fallback to copy link
          await handleCopyLink();
        }
      }
    } else {
      // Fallback to copy link if native share isn't supported
      await handleCopyLink();
    }
  };

  const iconSize =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  const buttonSize = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";

  if (variant === "minimal") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={() => handleShare("twitter")}
          className={`btn btn-ghost ${buttonSize} text-[#1DA1F2] hover:bg-[#1DA1F2]/10`}
          title="Share on X"
        >
          <X className={iconSize} />
        </button>
        <button
          onClick={() => handleShare("linkedin")}
          className={`btn btn-ghost ${buttonSize} text-[#0077B5] hover:bg-[#0077B5]/10`}
          title="Share on LinkedIn"
        >
          <Linkedin className={iconSize} />
        </button>
        <button
          onClick={handleCopyLink}
          className={`btn btn-ghost ${buttonSize} ${
            copied ? "text-success" : "text-base-content"
          }`}
          title="Copy link"
        >
          {copied ? (
            <Check className={iconSize} />
          ) : (
            <Copy className={iconSize} />
          )}
        </button>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div
        className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-40 ${className}`}
      >
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleShare("twitter")}
            className="btn btn-circle btn-ghost bg-black text-white hover:bg-black/80 shadow-lg"
            title="Share on X"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleShare("linkedin")}
            className="btn btn-circle btn-ghost bg-[#0077B5] text-white hover:bg-[#0077B5]/80 shadow-lg"
            title="Share on LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className={`btn btn-circle btn-ghost shadow-lg ${
              copied
                ? "bg-success text-white"
                : "bg-base-100 text-base-content hover:bg-base-200"
            }`}
            title="Copy link"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Link className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // Default variant with dropdown
  return (
    <div className={`relative ${className}`}>
      <div className="dropdown dropdown-end">
        <div
          tabIndex={0}
          role="button"
          className={`cursor-pointer inline-flex items-center justify-center rounded-md px-2 py-2 text-gray-600 hover:bg-gray-100 transition ${
            showDropdown ? "bg-gray-100" : ""
          }`}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <ShareIos className="w-5 h-5" />
        </div>
        <div
          tabIndex={0}
          className="dropdown-content card bg-base-100 shadow-xl border border-base-300 w-80 p-4 mt-2"
        >
          <h3 className="font-semibold mb-3">Share this project</h3>

          {/* Native share (if available) */}
          {isClient && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="btn btn-ghost w-full justify-start mb-2"
            >
              <ShareIos className="w-4 h-4 mr-3" />
              Share via...
            </button>
          )}

          <div className="grid grid-cols-1 gap-2 mb-4">
            {/* X */}
            <button
              onClick={() => handleShare("twitter")}
              className="btn btn-ghost justify-start text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
            >
              <X className="w-4 h-4 mr-2" />
              X
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => handleShare("linkedin")}
              className="btn btn-ghost justify-start text-[#0077B5] hover:bg-[#0077B5]/10"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </button>
          </div>

          {/* Copy link */}
          <div className="border-t border-base-300 pt-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="input input-bordered input-sm flex-1 text-xs"
              />
              <button
                onClick={handleCopyLink}
                className={`btn btn-sm ${
                  copied ? "btn-success" : "btn-primary"
                }`}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Social media follow buttons component
export function SocialFollow({
  className = "",
  variant = "horizontal", // horizontal, vertical
  size = "md",
}) {
  const iconSize =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  const buttonSize = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";

  const socialLinks = [
    {
      name: "X",
      url: "https://x.com/ailaunchspace",
      icon: X,
      color: "text-white",
      bgColor: "hover:bg-[#ED0D79]",
    },
    {
      name: "GitHub",
      url: "https://github.com/SashaDiz/ailaunch-space",
      icon: Github,
      color: "text-white",
      bgColor: "hover:bg-[#ED0D79]",
    },
  ];

  const containerClasses =
    variant === "vertical"
      ? "flex flex-col space-y-2"
      : "flex items-center space-x-2";

  return (
    <div className={`${containerClasses} ${className}`}>
      {socialLinks.map((social) => {
        const IconComponent = social.icon;
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-ghost ${buttonSize} ${social.color} ${social.bgColor}`}
            title={`Follow us on ${social.name}`}
          >
            <IconComponent />
            {variant === "vertical" && (
              <span className="ml-2">Follow on {social.name}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}

export default SocialShare;
