import React from "react";
import Image from "next/image";
import { ArrowUpRight } from "iconoir-react";

export default function SponsorCard({
  sponsor,
  becomePartnerUrl = "/become-a-partner",
}) {
  return sponsor ? (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full"
    >
      <div className="relative flex items-start gap-4 border rounded-2xl p-5 w-full bg-white transition duration-300 hover:border-[#ED0D79] cursor-pointer group">

        <div className="flex-shrink-0">
          <Image
            src={sponsor.logo}
            alt={sponsor.name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-lg bg-gray-50 object-contain"
          />
        </div>
        <div>
          <div className="font-semibold text-lg text-gray-900">
            {sponsor.name}
          </div>
          <div className="text-gray-700 text-sm mt-1">
            {sponsor.description}
          </div>
        </div>
        
        {/* Arrow icon that appears on hover */}
        <ArrowUpRight 
          className="absolute top-3 right-3 w-5 h-5 text-[#ED0D79] opacity-0 translate-x-0 translate-y-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:translate-y-[-4px] transition-all duration-300 ease-out"
        />
      </div>
    </a>
  ) : (
    <a href={becomePartnerUrl} className="w-full">
      <div className="flex flex-col items-center justify-center border rounded-2xl p-8 w-full bg-gray-50 text-gray-900 transition duration-300 hover:border-gray-900 cursor-pointer min-h-[120px]">
        <span className="text-3xl mb-2 font-light">+</span>
        <span className="font-medium text-lg">Become a Partner</span>
      </div>
    </a>
  );
}
