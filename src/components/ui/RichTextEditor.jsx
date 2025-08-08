import React, { useRef, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Bold, Italic, Underline, List, ListOrdered, Link } from "lucide-react";

const RichTextEditor = ({
  id,
  value,
  onChange,
  placeholder = "Enter your description...",
  maxLength = 3000,
  label,
  required = false,
  className,
  rows = 10,
  ...props
}) => {
  const editorRef = useRef(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  // Get plain text length for character counting
  const getTextLength = (content) => {
    if (!content) return 0;
    // Create a temporary div to strip HTML tags for accurate character count
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    return tempDiv.textContent?.length || 0;
  };

  const currentLength = getTextLength(value);
  const isOverLimit = currentLength > maxLength;

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      const textLength = getTextLength(newContent);

      if (textLength <= maxLength) {
        onChange(newContent);
      } else {
        // Truncate content if over limit
        const plainText = editorRef.current.textContent || "";
        const truncatedText = plainText.substring(0, maxLength);
        editorRef.current.textContent = truncatedText;
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  // Format text functions
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  // Handle focus events
  const handleFocus = () => {
    setIsToolbarVisible(true);
  };

  const handleBlur = () => {
    // Delay hiding to allow toolbar clicks
    setTimeout(() => {
      if (!editorRef.current?.contains(document.activeElement)) {
        setIsToolbarVisible(false);
      }
    }, 100);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label} {required && "*"}
        </Label>
      )}

      <div className="relative">
        {/* Toolbar */}
        <div
          className={cn(
            "border border-b-0 border-gray-200 bg-gray-50 rounded-t-lg px-3 py-2 transition-opacity",
            isToolbarVisible ? "opacity-100" : "opacity-50",
            isOverLimit && "border-red-300"
          )}
        >
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              onClick={() => formatText("bold")}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              onClick={() => formatText("italic")}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              onClick={() => formatText("underline")}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              onClick={() => formatText("insertUnorderedList")}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              onClick={() => formatText("insertOrderedList")}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              onClick={() => {
                const url = prompt("Enter URL:");
                if (url) {
                  formatText("createLink", url);
                }
              }}
              title="Add Link"
            >
              <Link className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

            <select
              className="px-2 py-1 text-sm border-0 bg-transparent rounded hover:bg-gray-200 focus:outline-none"
              onChange={(e) => {
                if (e.target.value) {
                  formatText("formatBlock", e.target.value);
                  e.target.value = "";
                }
              }}
              title="Text Style"
            >
              <option value="">Style</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="p">Paragraph</option>
            </select>
          </div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "min-h-[18rem] p-4 border border-gray-200 rounded-b-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 text-sm leading-relaxed",
            isOverLimit &&
              "border-red-300 focus:border-red-500 focus:ring-red-500"
          )}
          style={{
            minHeight: `${rows * 1.5}rem`,
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
          {...props}
        />

        {/* Character counter */}
        <div
          className={cn(
            "text-sm mt-2 text-right",
            isOverLimit
              ? "text-red-600"
              : currentLength > maxLength * 0.8
              ? "text-amber-600"
              : "text-gray-500"
          )}
        >
          {currentLength}/{maxLength} characters
          {isOverLimit && (
            <span className="block text-red-600 text-xs">
              Character limit exceeded. Content will be truncated.
            </span>
          )}
        </div>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        [contenteditable] h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }

        [contenteditable] h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }

        [contenteditable] h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }

        [contenteditable] p {
          margin: 0.5rem 0;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        [contenteditable] li {
          margin: 0.25rem 0;
        }

        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }

        [contenteditable] strong {
          font-weight: 600;
        }

        [contenteditable] em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
