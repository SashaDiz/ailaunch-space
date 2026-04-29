"use client";

import React, { useState } from "react";
import { Mail, Check, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NewsletterSignup({
  variant = "default", // default, minimal, footer, popup
  source = "website",
  className = "",
  title,
  description,
  placeholder = "Enter your email address",
  buttonText = "Subscribe",
  showBenefits = true,
}: {
  variant?: string;
  source?: string;
  className?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  showBenefits?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          source,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        toast.success(data.message || "Successfully subscribed!");
        setEmail("");

        setTimeout(() => {
          setStatus("idle");
        }, 3000);
      } else {
        setStatus("error");
        setError(data.error || "Subscription failed");

        if (data.code === "ALREADY_SUBSCRIBED") {
          toast.error("You are already subscribed to our newsletter");
        } else {
          toast.error(data.error || "Failed to subscribe");
        }
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setStatus("error");
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Minimal variant
  if (variant === "minimal") {
    return (
      <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-background" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-4"
            disabled={status === "loading" || status === "success"}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={status === "loading" || status === "success"}
          className={cn(
            "min-w-[120px] font-semibold",
            status === "success"
              ? "bg-success hover:bg-success text-success-foreground"
              : "bg-primary hover:bg-primary/90 text-background"
          )}
        >
          {status === "loading" && (
            <RefreshCw className="w-4 h-4 animate-spin" />
          )}
          {status === "success" && <Check className="w-4 h-4" />}
          {status === "success" ? "Subscribed!" : buttonText}
        </Button>
        {error && <p className="text-destructive text-sm mt-1">{error}</p>}
      </div>
    );
  }

  // Footer variant
  if (variant === "footer") {
    return (
      <div className={className}>
        <div className="flex items-center space-x-2 mb-3">
          <Mail className="w-6 h-6 mb-[2px] text-muted-foreground" />
          <h3 className="font-semibold text-lg leading-none text-foreground">Stay Updated</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          Get weekly updates on new projects and
          platform news.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              disabled={status === "loading" || status === "success"}
              className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30"
            />
          </div>
          <Button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className={cn(
              "w-full font-semibold",
              status === "success"
                ? "bg-success hover:bg-success text-success-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {status === "loading" && (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
            {status === "success" && <Check className="w-4 h-4" />}
            {status === "success" ? "Subscribed!" : buttonText}
          </Button>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </form>
      </div>
    );
  }

  // Default variant
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-background" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-none">
              {title || "Join Our Newsletter"}
            </h3>
            <p className="text-background/70 text-sm">
              {description ||
                "Get the latest project updates and platform news"}
            </p>
          </div>
        </div>

        {showBenefits && (
          <div className="mb-6">
            <ul className="space-y-2 text-sm text-background/70">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Weekly project roundups
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Platform updates
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Platform updates &amp; new features
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Launch tips &amp; best practices
              </li>
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-background" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                className="pl-10"
                disabled={status === "loading" || status === "success"}
              />
            </div>
            {error && (
              <p className="text-destructive text-xs">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className={cn(
              "w-full font-semibold",
              status === "success"
                ? "bg-success hover:bg-success text-success-foreground"
                : "bg-primary hover:bg-primary/90 text-background"
            )}
          >
            {status === "loading" && (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
            {status === "success" && <Check className="w-4 h-4" />}
            {status === "success" ? "Successfully Subscribed!" : buttonText}
          </Button>
        </form>

        <p className="text-xs text-background/70 mt-4 text-center">
          No spam. Unsubscribe at any time. We respect your privacy.
        </p>
      </CardContent>
    </Card>
  );
}

// Newsletter popup component for marketing
export function NewsletterPopup({
  isOpen,
  onClose,
  delay = 3000,
  source = "popup",
}) {
  const [show, setShow] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShow(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, delay]);

  const handleClose = () => {
    setShow(false);
    onClose?.();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50">
      <Card className="max-w-md w-full relative shadow-xl">
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-background" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Don't Miss Out!</h2>
            <p className="text-muted-foreground">
              Join 500+ project builders getting weekly updates on the latest
              launches and platform features.
            </p>
          </div>

          <NewsletterSignup
            variant="minimal"
            source={source}
            placeholder="your@email.com"
            buttonText="Join Newsletter"
            showBenefits={false}
            className="mb-4"
          />

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Join our community and get exclusive insights delivered to your
              inbox.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewsletterSignup;
