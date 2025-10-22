"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Copy, CheckCircle } from "iconoir-react";
import toast from "react-hot-toast";

/**
 * WinnerEmbed Component
 * Displays embed code for winners with dofollow backlink
 * Based on the provided design with AI Launch Space branding
 */
export default function WinnerEmbed({
  position,
  projectName,
  projectSlug,
  className = ""
}) {
  const [copied, setCopied] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  if (!position || position < 1 || position > 3) {
    return null;
  }

  const getPositionText = (pos) => {
    switch (pos) {
      case 1:
        return "#1 AI Product on AILaunch.space";
      case 2:
        return "#2 AI Product on AILaunch.space";
      case 3:
        return "#3 AI Product on AILaunch.space";
      default:
        return "Featured on AILaunch.space";
    }
  };

  const embedCode = isDarkTheme 
    ? `<a href="https://ailaunch.space/" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
<div style="width: auto; min-width: 225px; height: 52px; display: flex; align-items: center; justify-content: flex-start; background: #1f2937; gap: 8px; border: 1px solid #374151; border-radius: 8px; padding: 8px 16px 8px 8px; font-family: system-ui, -apple-system, sans-serif;">
  <img src="https://ailaunch.space/assets/ailaunch-embed-white.svg" alt="#${position} AI Product on AILaunch.space" width="42" height="42" style="flex-shrink: 0;" />
  <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; font-size: 14px; font-weight: 700; line-height: 1.2; color: #f9fafb;">
    #${position} AI Product of the Week
    <span style="color: #ED0D79; font-size: 12px;">AILaunch.space</span>
  </div>
</div>
</a>`
    : `<a href="https://ailaunch.space/" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
<div style="width: auto; min-width: 225px; height: 52px; display: flex; align-items: center; justify-content: flex-start; background: white; gap: 8px; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 16px 8px 8px; font-family: system-ui, -apple-system, sans-serif;">
  <img src="https://ailaunch.space/assets/ailaunch-embed.svg" alt="#${position} AI Product on AILaunch.space" width="42" height="42" style="flex-shrink: 0;" />
  <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; font-size: 14px; font-weight: 700; line-height: 1.2; color: #111827;">
    #${position} AI Product of the Week
    <span style="color: #ED0D79; font-size: 12px;">AILaunch.space</span>
  </div>
</div>
</a>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success("Embed code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy embed code");
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Featured on AILaunch.space
        </h3>
        <p className="text-gray-600">
          Place the downloaded badge on your website with a link back to AILaunch.space.
        </p>
      </div>

      {/* Theme Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Badge Theme</h4>
            <p className="text-xs text-gray-600">Choose between light and dark theme for your badge</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkTheme(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
                !isDarkTheme 
                  ? 'bg-[#ED0D79] text-white' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setIsDarkTheme(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
                isDarkTheme 
                  ? 'bg-[#ED0D79] text-white' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <p className="text-gray-700 font-medium mb-3">
          Here's the recommended HTML code:
        </p>
      </div>

      {/* Code Block */}
      <div className="relative mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-mono text-gray-800 overflow-x-auto">
          <pre className="whitespace-pre overflow-x-auto">
            <code>{embedCode}</code>
          </pre>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopyCode}
          className="absolute top-3 right-3 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#ED0D79] transition-colors duration-200 shadow-sm"
          title="Copy embed code"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Badge Preview */}
      <div className="mb-6 pt-6 border-t border-gray-200">
        <p className="text-gray-700 font-medium mb-4">Badge preview:</p>
        <div className="inline-block p-4 bg-gray-50 rounded-xl border border-gray-200">
          <a
            href="https://ailaunch.space/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div 
              width="225" 
              height="52" 
              className={`flex items-center justify-start gap-2 border rounded-lg p-2 pr-4 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200 ${
                isDarkTheme 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-white border-gray-300'
              }`}
            >
            <img
               src={isDarkTheme ? "/assets/ailaunch-embed-white.svg" : "/assets/ailaunch-embed.svg"}
               alt={`#${position} AI Product on AILaunch.space`}
               width="42"
               height="42"
             />
              <div className={`flex flex-col items-start justify-start text-md font-medium leading-tight ${
                isDarkTheme ? 'text-gray-100' : 'text-gray-900'
              }`}> 
                #{position} AI Product of the Week
                <span className="text-[#ED0D79] text-sm">AILaunch.space</span>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Additional Info */}
      <div className="p-4 bg-[#ED0D79]/5 border border-[#ED0D79]/20 rounded-xl">
        <p className="text-sm text-[#ED0D79] font-medium">
          <strong>💡 Pro Tip:</strong> This embed includes a dofollow backlink to AILaunch.space.
          Make sure to place it on your website to receive the SEO benefits and boost your domain authority.
        </p>
      </div>
    </div>
  );
}

/**
 * WinnerEmbedModal Component
 * Modal version of the embed component for popup display
 */
export function WinnerEmbedModal({
  isOpen,
  onClose,
  position,
  projectName,
  projectSlug
}) {
  const [mounted, setMounted] = useState(false);

  // Handle mounting for SSR compatibility
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when modal is open and handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Embed Badge for {projectName}
              </h2>
              <p className="text-gray-600 text-sm">
                Share your achievement with a dofollow backlink
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Embed Component */}
          <WinnerEmbed
            position={position}
            projectName={projectName}
            projectSlug={projectSlug}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/**
 * WinnerEmbedButton Component
 * Button to trigger the embed modal
 */
export function WinnerEmbedButton({
  position,
  projectName,
  projectSlug,
  className = ""
}) {
  const [showModal, setShowModal] = useState(false);

  if (!position || position < 1 || position > 3) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:border-[#ED0D79] hover:bg-gray-50 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm text-sm ${className}`}
        title="Get embed code for your website"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Embed
      </button>

      <WinnerEmbedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        position={position}
        projectName={projectName}
        projectSlug={projectSlug}
      />
    </>
  );
}
