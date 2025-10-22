"use client";

import React, { useState, useRef, useEffect } from "react";
import { NavArrowDown, Check } from "iconoir-react";

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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full py-3 pl-3 pr-8 border border-gray-300 rounded-xl focus-visible:border-[#ED0D79] focus-visible:ring-2 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none transition-all duration-200 bg-white hover:border-gray-400 text-left flex items-center justify-between ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon && <selectedOption.icon className="w-4 h-4" />}
          <span>{selectedOption?.label || placeholder}</span>
        </span>
        <NavArrowDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                value === option.value ? "bg-[#ED0D79]/10" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                {option.icon && <option.icon className="w-4 h-4" />}
                <span>{option.label}</span>
              </span>
              {value === option.value && (
                <Check className="w-4 h-4 text-[#ED0D79]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
