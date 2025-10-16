"use client";

import React, { useState } from "react";
import { Copy, CheckCircle } from "iconoir-react";
import toast from "react-hot-toast";

/**
 * WinnerEmbed Component
 * Displays embed code for winners with dofollow backlink
 * Based on the provided design with AI Launch Space branding
 */
export default function WinnerEmbed({ 
  position, 
  directoryName, 
  directorySlug,
  className = "" 
}) {
  const [copied, setCopied] = useState(false);

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

  const embedCode = `<a href="https://ailaunch.space/" target="_blank" rel="noopener noreferrer">
<img src="https://unicorn-images.b-cdn.net/227cf7e3-96b4-4970-b438-ddc370c5178a" alt="${getPositionText(position)}" width="225" height="52" />
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
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Featured on AILaunch.space
        </h3>
        <p className="text-sm text-gray-600">
          Place the downloaded badge on your website with a link back to AILaunch.space.
        </p>
      </div>

      {/* Instructions */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-2">
          Here's the recommended HTML code:
        </p>
      </div>

      {/* Code Block */}
      <div className="relative">
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono text-gray-800 overflow-x-auto">
          <code>{embedCode}</code>
        </pre>
        
        {/* Copy Button */}
        <button
          onClick={handleCopyCode}
          className="absolute top-2 right-2 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
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
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">Badge example:</p>
        <div className="inline-block">
          <a 
            href="https://ailaunch.space/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block"
          >
            <img 
              src="https://unicorn-images.b-cdn.net/227cf7e3-96b4-4970-b438-ddc370c5178a" 
              alt={getPositionText(position)} 
              width="225" 
              height="52"
              className="border border-gray-300 rounded-lg"
            />
          </a>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> This embed includes a dofollow backlink to AILaunch.space. 
          Make sure to place it on your website to receive the SEO benefits.
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
  directoryName, 
  directorySlug 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Embed Badge for {directoryName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Embed Component */}
          <WinnerEmbed 
            position={position} 
            directoryName={directoryName} 
            directorySlug={directorySlug} 
          />
        </div>
      </div>
    </div>
  );
}

/**
 * WinnerEmbedButton Component
 * Button to trigger the embed modal
 */
export function WinnerEmbedButton({ 
  position, 
  directoryName, 
  directorySlug, 
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
        className={`btn btn-outline btn-sm ${className}`}
        title="Get embed code for your website"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Embed
      </button>

      <WinnerEmbedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        position={position}
        directoryName={directoryName}
        directorySlug={directorySlug}
      />
    </>
  );
}
