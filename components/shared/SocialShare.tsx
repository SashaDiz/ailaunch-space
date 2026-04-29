"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  X,
  Linkedin,
  Link,
  Check,
  Copy,
  Twitter,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site.config";

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
  const shareTitle = title || `Check out this project on ${siteConfig.name}!`;
  const shareDescription =
    description || `Discover amazing directories and projects on ${siteConfig.name}`;
  const shareHashtags =
    hashtags.length > 0 ? hashtags : [siteConfig.name.replace(/\s+/g, ''), "Directory", "Projects"];

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
  const buttonSizeMap = {
    sm: "sm" as const,
    md: "default" as const,
    lg: "lg" as const,
  };
  const btnSize = buttonSizeMap[size] || ("default" as const);

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Button
          variant="ghost"
          size={btnSize}
          onClick={() => handleShare("twitter")}
          className="text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
          title="Share on X"
        >
          <Twitter className={iconSize} />
        </Button>
        <Button
          variant="ghost"
          size={btnSize}
          onClick={() => handleShare("linkedin")}
          className="text-[#0077B5] hover:bg-[#0077B5]/10"
          title="Share on LinkedIn"
        >
          <Linkedin className={iconSize} />
        </Button>
        <Button
          variant="ghost"
          size={btnSize}
          onClick={handleCopyLink}
          className={copied ? "text-success" : "text-foreground"}
          title="Copy link"
        >
          {copied ? (
            <Check className={iconSize} />
          ) : (
            <Copy className={iconSize} />
          )}
        </Button>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div
        className={cn("fixed right-6 top-1/2 transform -translate-y-1/2 z-40", className)}
      >
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleShare("twitter")}
            className="rounded-[var(--radius)] bg-foreground text-background hover:bg-foreground/80"
            style={{ boxShadow: "var(--button-shadow)" }}
            title="Share on X"
          >
            <Twitter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleShare("linkedin")}
            className="rounded-[var(--radius)] bg-[#0077B5] text-background hover:bg-[#0077B5]/80"
            style={{ boxShadow: "var(--button-shadow)" }}
            title="Share on LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            className={cn(
              "rounded-[var(--radius)]",
              copied
                ? "bg-success text-success-foreground"
                : "bg-primary hover:bg-primary/80 text-primary-foreground"
            )}
            style={{ boxShadow: "var(--button-shadow)" }}
            title="Copy link"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Link className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Default variant with dropdown
  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div
          tabIndex={0}
          role="button"
          className={cn(
            "cursor-pointer inline-flex items-center justify-center rounded-[var(--radius)] px-2 py-2 text-muted-foreground hover:bg-muted transition",
            showDropdown && "bg-muted"
          )}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <Share2 className="w-5 h-5" />
        </div>
        {showDropdown && (
          <div className="absolute right-0 z-50 bg-background border border-border rounded-[var(--radius)] w-80 p-4 mt-2" style={{ boxShadow: "var(--card-shadow)" }}>
            <h3 className="font-medium mb-3">Share this project</h3>

            {/* Native share (if available) */}
            {isClient && navigator.share && (
              <Button
                variant="ghost"
                onClick={handleNativeShare}
                className="w-full justify-start mb-2"
                style={{ boxShadow: "var(--button-shadow)" }}
              >
                <Share2 className="w-4 h-4 mr-3" />
                Share via...
              </Button>
            )}

            <div className="grid grid-cols-1 gap-2 mb-4">
              {/* X */}
              <Button
                variant="ghost"
                onClick={() => handleShare("twitter")}
                className="justify-start text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
                style={{ boxShadow: "var(--button-shadow)" }}
              >
                <Twitter className="w-4 h-4 mr-2" />
                X
              </Button>

              {/* LinkedIn */}
              <Button
                variant="ghost"
                onClick={() => handleShare("linkedin")}
                className="justify-start text-[#0077B5] hover:bg-[#0077B5]/10"
                style={{ boxShadow: "var(--button-shadow)" }}
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
            </div>

            {/* Copy link */}
            <div className="border-t border-border pt-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-xs h-8"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className={
                    copied
                      ? "bg-success hover:bg-success text-success-foreground"
                      : "bg-primary hover:bg-primary text-primary-foreground"
                  }
                  style={{ boxShadow: "var(--button-shadow)" }}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
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
  const buttonSizeMap = {
    sm: "sm" as const,
    md: "default" as const,
    lg: "lg" as const,
  };
  const btnSize = buttonSizeMap[size] || ("default" as const);

  const socialLinks = [
    {
      name: "X",
      url: siteConfig.social.twitter ? `https://x.com/${siteConfig.social.twitter.replace('@', '')}` : "#",
      icon: Twitter,
      color: "text-muted-foreground",
      bgColor: "hover:text-foreground hover:bg-accent",
    },
  ];

  const containerClasses =
    variant === "vertical"
      ? "flex flex-col space-y-2"
      : "flex items-center space-x-2";

  return (
    <div className={cn(containerClasses, className)}>
      {socialLinks.map((social) => {
        const IconComponent = social.icon;
        return (
          <Button
            key={social.name}
            variant="ghost"
            size={btnSize}
            asChild
          >
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(social.color, social.bgColor)}
              title={`Follow us on ${social.name}`}
            >
              <IconComponent />
              {variant === "vertical" && (
                <span className="ml-2">Follow on {social.name}</span>
              )}
            </a>
          </Button>
        );
      })}
    </div>
  );
}

export default SocialShare;
