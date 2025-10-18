"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { useSupabase } from "./SupabaseProvider";
import { Menu, NavArrowDown, PlusCircle } from "iconoir-react";
import Image from "next/image";
import { gsap } from "gsap";

export function Header() {
  const { user, loading } = useUser();
  const { supabase } = useSupabase();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const plusIconRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Ensure we're on the client side before setting up scroll listener
  useEffect(() => {
    setIsClient(true);
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 0);
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Check initial scroll position
    handleScroll();

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        // Get all categories for the dropdown
        setCategories(data.data.categories || []);
        setGroupedCategories(data.data.groupedCategories || {});
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handlePlusIconHover = () => {
    if (isClient && plusIconRef.current) {
      gsap.to(plusIconRef.current, {
        rotation: 90,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handlePlusIconLeave = () => {
    if (isClient && plusIconRef.current) {
      gsap.to(plusIconRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  // Generate color for category dots
  const getCategoryDotColor = (category) => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-indigo-500",
      "bg-cyan-500",
      "bg-emerald-500",
      "bg-lime-500",
      "bg-violet-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-teal-500",
      "bg-slate-500",
      "bg-red-500",
      "bg-yellow-500",
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isClient && isScrolled 
        ? 'bg-white/80 backdrop-blur-md' 
        : 'bg-transparent backdrop-blur-none'
    }`}>
      <div className="max-w-[1280px] mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
            <Link href="/">
              <Image
                src="/assets/logo.svg"
                alt="AI Launch Space"
                height={40}
                width={40}
                priority
                style={{ width: "auto", height: "44px" }}
              />
            </Link>

          {/* Right side - Navigation, CTA and Auth */}
          <div className="flex items-center space-x-3">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link
                href="/pricing"
                className="px-3 py-2 text-sm font-medium text-base-content hover:text-primary transition-colors"
              >
                Pricing
              </Link>
              <div className="dropdown dropdown-hover">
                <div
                  tabIndex={0}
                  className="flex items-center px-3 py-2 text-sm font-medium text-base-content hover:text-primary transition-colors cursor-pointer"
                >
                  Browse AI Projects
                  <NavArrowDown className="ml-1 h-3 w-3" />
                </div>
                <div className="dropdown-content bg-base-100 rounded-box w-80 border border-base-300 shadow-lg max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="p-3 border-b border-base-300">
                    <Link
                      href="/directories"
                      className="flex items-center font-medium text-primary hover:text-primary/80"
                    >
                      <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                      View all AI projects
                    </Link>
                  </div>

                  {/* Scrollable Categories */}
                  <div className="max-h-80 overflow-y-auto">
                    {Object.entries(groupedCategories).map(([sphere, sphereCategories]) => (
                      <div key={sphere} className="border-b border-base-300 last:border-b-0">
                        {/* Sphere Header */}
                        <div className="px-3 py-2 bg-base-200 text-sm font-medium text-base-content/80 sticky top-0">
                          {sphere}
                        </div>
                        
                        {/* Categories in Sphere */}
                        <div className="py-1">
                          {sphereCategories.map((category) => (
                            <Link
                              key={category.id || category.name}
                              href={`/directories?category=${
                                category.slug || category.name
                              }`}
                              className="flex items-center px-6 py-2 text-sm text-base-content hover:bg-base-200 hover:text-primary transition-colors"
                            >
                              <span
                                className={`w-2 h-2 ${getCategoryDotColor(
                                  category.name
                                )} rounded-full mr-3 flex-shrink-0`}
                              ></span>
                              <span className="truncate">{category.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </nav>
            {/* Launch AI Project Button */}
            <Link
              href="/submit"
              className="text-center bg-[#ED0D79] text-white rounded-lg px-4 py-3 font-semibold text-sm no-underline transition duration-300 hover:scale-105 hidden sm:flex items-center gap-2"
              onMouseEnter={handlePlusIconHover}
              onMouseLeave={handlePlusIconLeave}
            >
              <PlusCircle 
                ref={plusIconRef} 
                className="h-[18px] w-[18px]"
                strokeWidth={2}
              />
              Launch your AI project
            </Link>

            {/* Authentication */}
            {!isClient || loading ? (
              <div className="skeleton w-8 h-8 rounded-full"></div>
            ) : user ? (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-sm p-1"
                >
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full border-2 border-base-300">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.full_name || user.email || "User"}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-xs font-medium">
                          {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300 mt-2"
                >
                  <li className="menu-title px-4 py-2 text-xs">
                    <div>
                      <p className="font-medium">{user.user_metadata?.full_name || "User"}</p>
                      <p className="text-base-content/60">
                        {user.email}
                      </p>
                    </div>
                  </li>
                  <div className="divider my-1"></div>
                  <li>
                    <Link href="/profile">My Profile</Link>
                  </li>
                  <li>
                    <Link href="/dashboard">Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/settings">Account Settings</Link>
                  </li>
                  <div className="divider my-1"></div>
                  <li>
                    <button onClick={async () => {
                      await supabase.auth.signOut();
                      router.push("/");
                      router.refresh();
                    }}>
                      Sign out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="btn btn-ghost btn-sm font-medium"
                >
                  Sign in
                </Link>
                <div className="w-px h-4 bg-base-300"></div>
                <span className="text-base-content/60 text-sm">✕</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-sm p-2"
                >
                  <Menu className="h-5 w-5" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300 mt-2"
                >
                  <li>
                    <Link href="/pricing">Pricing</Link>
                  </li>
                  <li>
                    <Link href="/directories">Browse AI projects</Link>
                  </li>
                  <li>
                    <Link href="/past-launches">Past Launches</Link>
                  </li>
                  <div className="divider my-1"></div>
                  <li>
                    <Link href="/submit" className="text-primary font-medium">
                      Launch your AI project
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
