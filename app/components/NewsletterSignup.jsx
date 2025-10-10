"use client";

import React, { useState } from "react";
import { Mail, Check, Xmark, RefreshDouble } from "iconoir-react";
import toast from "react-hot-toast";

export function NewsletterSignup({
  variant = "default", // default, minimal, footer, popup
  source = "website",
  className = "",
  title,
  description,
  placeholder = "Enter your email address",
  buttonText = "Subscribe",
  showBenefits = true,
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

        // Reset success state after 3 seconds
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

  // Different variants
  if (variant === "minimal") {
    return (
      <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="input input-bordered w-full pl-10 pr-4"
            disabled={status === "loading" || status === "success"}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={status === "loading" || status === "success"}
          className={`btn ${
            status === "success" ? "btn-success" : "btn-primary"
          } min-w-[120px]`}
        >
          {status === "loading" && (
            <RefreshDouble className="w-4 h-4 animate-spin mr-2" />
          )}
          {status === "success" && <Check className="w-4 h-4 mr-2" />}
          {status === "success" ? "Subscribed!" : buttonText}
        </button>
        {error && <p className="text-error text-sm mt-1">{error}</p>}
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Stay Updated</h3>
        </div>
        <p className="text-base-content/70 text-sm mb-4">
          Get weekly updates on new directories, competition results, and
          platform news.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className="input input-bordered w-full"
              disabled={status === "loading" || status === "success"}
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className={`btn w-full ${
              status === "success" ? "btn-success" : "btn-primary"
            }`}
          >
            {status === "loading" && (
              <RefreshDouble className="w-4 h-4 animate-spin mr-2" />
            )}
            {status === "success" && <Check className="w-4 h-4 mr-2" />}
            {status === "success" ? "Subscribed!" : buttonText}
          </button>
          {error && <p className="text-error text-sm">{error}</p>}
        </form>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`card bg-base-100 shadow-sm border border-base-300 ${className}`}
    >
      <div className="card-body p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {title || "Join Our Newsletter"}
            </h3>
            <p className="text-base-content/60 text-sm">
              {description ||
                "Get the latest directory updates and platform news"}
            </p>
          </div>
        </div>

        {showBenefits && (
          <div className="mb-6">
            <ul className="space-y-2 text-sm text-base-content/70">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Weekly directory roundups
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Competition results &amp; winners
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
          <div className="form-control">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                className="input input-bordered w-full pl-10"
                disabled={status === "loading" || status === "success"}
              />
            </div>
            {error && (
              <label className="label">
                <span className="label-text-alt text-error">{error}</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className={`btn w-full ${
              status === "success" ? "btn-success" : "btn-primary"
            }`}
          >
            {status === "loading" && (
              <RefreshDouble className="w-4 h-4 animate-spin mr-2" />
            )}
            {status === "success" && <Check className="w-4 h-4 mr-2" />}
            {status === "success" ? "Successfully Subscribed!" : buttonText}
          </button>
        </form>

        <p className="text-xs text-base-content/50 mt-4 text-center">
          No spam. Unsubscribe at any time. We respect your privacy.
        </p>
      </div>
    </div>
  );
}

// Newsletter popup component for marketing
export function NewsletterPopup({
  isOpen,
  onClose,
  delay = 3000, // Show after 3 seconds
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card bg-base-100 shadow-xl max-w-md w-full relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
        >
          <Xmark className="w-4 h-4" />
        </button>

        <div className="card-body p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Don't Miss Out!</h2>
            <p className="text-base-content/70">
              Join 500+ directory builders getting weekly updates on the latest
              launches, competition results, and platform features.
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
            <p className="text-xs text-base-content/50">
              Join our community and get exclusive insights delivered to your
              inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsletterSignup;
