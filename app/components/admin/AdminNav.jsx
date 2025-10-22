"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavArrowLeft, Folder, StatsReport } from "iconoir-react";

const AdminNav = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Overview",
      href: "/admin",
      icon: StatsReport,
      current: pathname === "/admin",
    },
    {
      name: "Projects",
      href: "/admin/projects",
      icon: Folder,
      current: pathname === "/admin/projects",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-1">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#ED0D79] transition-colors"
            >
              <NavArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-gray-900 hidden sm:inline">Admin Panel</span>
          </div>
          
          <nav className="flex flex-wrap gap-1 sm:space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (!Icon) {
                console.error(`Icon not found for ${item.name}`);
                return null;
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? "bg-[#ED0D79] text-white"
                      : "text-gray-600 hover:text-[#ED0D79] hover:bg-[#ED0D79]/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AdminNav;
