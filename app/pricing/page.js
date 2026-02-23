"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Globe,
  Medal,
  Home,
  Crown,
  Trophy,
  Link as LinkIcon,
  Clock,
  Megaphone,
  Rocket,
} from "iconoir-react";
import { VoteRequiredModal } from "../components/VoteRequiredModal";
import { useUser } from "../hooks/useUser";

const plans = [
  {
    id: "standard",
    name: "Standard Launch",
    price: 0,
    currency: "USD",
    description: "Perfect for new AI projects and startups",
    icon: Globe,
    features: [
      { text: "Live on homepage for 7 days", icon: Home },
      { text: "15 slots weekly (limited availability)", icon: Crown },
      { text: "Badge for top 3 ranking products", icon: Trophy },
      // { text: "High authority lifetime backlink (only for Top 3 rankings)", icon: LinkIcon }, // Commented for future
      { text: "Standard launch queue", icon: Clock },
      { text: "Basic community exposure", icon: Megaphone },
    ],
    limitations: [],
    popular: false,
    cta: "Get Started",
    ctaClass: "btn-outline",
  },
  {
    id: "premium",
    name: "Premium Launch",
    price: 15,
    currency: "USD",
    description: "Maximum exposure for established AI projects",
    icon: Medal,
    features: [
      { text: "Extended homepage exposure (7 days)", icon: Home },
      { text: "Priority placement in top categories", icon: Crown },
      { text: "Badge for top 3 ranking products", icon: Trophy },
      // { text: "3+ Guaranteed high authority lifetime backlink", icon: LinkIcon }, // Commented for future
      { text: "Skip the queue - instant launch", icon: Clock },
      { text: "Enhanced social media promotion", icon: Megaphone },
      { text: "Premium badge for credibility", icon: Star },
      { text: "Featured in newsletter to subscribers", icon: Rocket },
      { text: "Priority support and feedback", icon: Medal },
    ],
    limitations: [],
    popular: true,
    cta: "Premium Launch",
    ctaClass: "btn-primary",
  },
];

function PricingCard({ plan, index, onLaunchClick, checkingVote }) {
  return (
    <div
      className={`card bg-white border transition-all ${
        plan.popular
          ? "border-pink-500 border-2"
          : "border-gray-200"
      }`}
    >
      <div className="card-body p-8 flex flex-col h-full">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-4 text-black">{plan.name}</h3>

          <div className="mb-6">
            <span className="text-4xl font-bold text-black">
              {plan.price === 0 ? "Free" : `$${plan.price}`}
            </span>
            {plan.price > 0 && (
              <span className="text-gray-500 ml-2 text-lg">/ launch</span>
            )}
          </div>
        </div>

        <div className="space-y-4 mb-8 flex-grow">
          <ul className="space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                {React.createElement(feature.icon, { 
                  className: "w-4 h-4 text-black mr-3 mt-0.5 flex-shrink-0",
                  strokeWidth: 1.5
                })}
                <span className="text-base text-black">{feature.text}</span>
              </li>
            ))}
          </ul>

          {plan.limitations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-500 text-base mb-3">
                Limitations:
              </h4>
              <ul className="space-y-2">
                {plan.limitations.map((limitation, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-base text-gray-500">
                      {limitation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => onLaunchClick(plan.id)}
          disabled={checkingVote}
          className={`w-full mt-auto py-4 px-6 rounded-lg font-semibold text-base transition duration-300 outline outline-4 outline-transparent min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed ${
            plan.popular 
              ? "bg-[#ED0D79] hover:bg-[#ED0D79]/90 text-white border-[#ED0D79] hover:scale-105" 
              : "bg-white hover:bg-[#ED0D79] text-black border border-gray-200 hover:text-white hover:border-[#ED0D79] hover:outline-[#ed0d7924]"
          }`}
        >
          {checkingVote ? 'Checking...' : plan.cta}
        </button>
      </div>
    </div>
  );
}


export default function PricingPage() {
  const [isVoteRequiredModalOpen, setIsVoteRequiredModalOpen] = useState(false);
  const [checkingVote, setCheckingVote] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  // Listen for vote success events - close vote required modal if open
  useEffect(() => {
    const handleVoteSuccess = async () => {
      if (isVoteRequiredModalOpen) {
        // User just voted - close the modal and navigate to submit
        setIsVoteRequiredModalOpen(false);
        if (selectedPlan) {
          router.push(`/submit?plan=${selectedPlan}`);
          setSelectedPlan(null);
        } else {
          router.push('/submit');
        }
      }
    };

    window.addEventListener('voteSuccess', handleVoteSuccess);
    return () => {
      window.removeEventListener('voteSuccess', handleVoteSuccess);
    };
  }, [isVoteRequiredModalOpen, selectedPlan, router]);

  // Handle Launch button click - check vote status
  const handleLaunchClick = async (planId) => {
    // If user is not authenticated, let them navigate normally
    // The submit page will handle authentication
    if (!user) {
      router.push(`/submit?plan=${planId}`);
      return;
    }

    // Check if user has voted today
    setCheckingVote(true);
    setSelectedPlan(planId);
    try {
      const response = await fetch('/api/vote/check-today', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.authenticated && !data.hasVotedToday) {
        // User hasn't voted today - show modal
        setIsVoteRequiredModalOpen(true);
      } else {
        // User has voted or there was an error - allow navigation
        router.push(`/submit?plan=${planId}`);
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
      // On error, allow navigation to avoid blocking users
      router.push(`/submit?plan=${planId}`);
      setSelectedPlan(null);
    } finally {
      setCheckingVote(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-white py-8 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Link href="/submit" className="inline-flex items-center px-6 py-3 bg-[#ED0D79] text-white rounded-lg font-semibold text-sm no-underline transition duration-300 hover:scale-105 hover:bg-[#ED0D79]/90">
              <Rocket className="w-4 h-4 mr-2" strokeWidth={2} />
              Launch your AI project
            </Link>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-black">
            Choose Your Launch Plan
          </h1>
          <p className="text-lg font-normal text-gray-700 max-w-2xl mx-auto">
            Choose the right launch type to unlock your project's full potential. All launches take place at 12:00 AM PST.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard 
              key={plan.id} 
              plan={plan} 
              index={index}
              onLaunchClick={handleLaunchClick}
              checkingVote={checkingVote}
            />
          ))}
        </div>
      </div>

      {/* Vote Required Modal */}
      <VoteRequiredModal
        isOpen={isVoteRequiredModalOpen}
        onClose={() => {
          setIsVoteRequiredModalOpen(false);
          setSelectedPlan(null);
        }}
      />
    </div>
  );
}
