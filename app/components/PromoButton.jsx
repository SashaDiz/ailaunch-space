import React from "react";

const PromoButton = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="block text-center bg-white text-gray-900 border border-gray-200 rounded-lg py-3 font-semibold text-sm no-underline mt-2 transition duration-300 outline outline-4 outline-transparent hover:border-[#ED0D79] hover:bg-[#ED0D79] hover:text-white hover:outline-[#ed0d7924]"
  >
    {children}
  </a>
);

export default PromoButton;
