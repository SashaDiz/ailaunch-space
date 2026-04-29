"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const CustomDropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-muted-foreground mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full py-3 pl-3 pr-8 border border-border rounded-xl focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none transition-all duration-200 bg-background hover:border-foreground/40 text-left flex items-center justify-between ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon && <selectedOption.icon className="w-4 h-4" />}
          <span>{selectedOption?.label || placeholder}</span>
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-muted-foreground/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`w-full px-3 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between ${
                value === option.value ? "bg-primary/10" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                {option.icon && <option.icon className="w-4 h-4" />}
                <span>{option.label}</span>
              </span>
              {value === option.value && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
