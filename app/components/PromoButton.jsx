import React from "react";

const PromoButton = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="block text-center bg-white text-gray-900 border-2 border-gray-900 rounded-lg py-3 font-semibold text-sm no-underline mt-2 transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)]"
  >
    {children}
  </a>
);

export default PromoButton;
