import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from "iconoir-react";

export default function UserProfileLink({ 
  userId, 
  userName, 
  userAvatar, 
  className = "",
  showAvatar = true,
  size = "sm" 
}) {
  if (!userId || !userName) {
    return null;
  }

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm", 
    md: "text-base",
    lg: "text-lg"
  };

  const avatarSizes = {
    xs: { width: 16, height: 16, className: "w-4 h-4" },
    sm: { width: 20, height: 20, className: "w-5 h-5" },
    md: { width: 24, height: 24, className: "w-6 h-6" },
    lg: { width: 32, height: 32, className: "w-8 h-8" }
  };

  return (
    <Link 
      href={`/user/${userId}`}
      className={`inline-flex items-center gap-2 text-gray-600 hover:text-[#ED0D79] transition-colors ${sizeClasses[size]} ${className}`}
    >
      {showAvatar && (
        <div className={`${avatarSizes[size].className} rounded-full overflow-hidden flex-shrink-0`}>
          {userAvatar ? (
            <Image
              src={userAvatar}
              alt={`${userName} avatar`}
              width={avatarSizes[size].width}
              height={avatarSizes[size].height}
              className="w-full h-full object-cover"
              unoptimized={true}
              onError={(e) => {
                const parent = e.target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="bg-[#ED0D79] text-white w-full h-full flex items-center justify-center text-xs font-bold">
                      ${userName[0]?.toUpperCase() || "U"}
                    </div>
                  `;
                }
              }}
            />
          ) : (
            <div className="bg-[#ED0D79] text-white w-full h-full flex items-center justify-center text-xs font-bold">
              {userName[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}
      <span className="font-medium">{userName}</span>
    </Link>
  );
}
