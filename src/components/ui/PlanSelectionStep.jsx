import React from "react";
import { Link } from "react-router-dom";
import PricingCard from "./PricingCard";
import { Crown, Star, Gift } from "lucide-react";

const plans = [
  {
    id: "standard_launch",
    planId: "standard_launch",
    title: "Standard Launch",
    price: "Free",
    icon: Gift,
    features: [
      "List on homepage for a week",
      "Entry in weekly limited availability",
      "Regular, not top ranking position",
      "Nofollow links (Top 3 get dofollow)",
      "Standard launch queue",
      "Max 15 spots per week",
    ],
    button: "Choose Standard",
    highlight: false,
    linkType: "nofollow (dofollow for top 3)",
  },
  {
    id: "support_launch",
    planId: "support_launch",
    title: "Support Launch",
    price: "Requires backlink",
    icon: Star,
    features: [
      "List on homepage for a week",
      "Entry in weekly limited availability",
      "Regular, top 3 ranking position",
      "Immediate dofollow links",
      "Standard launch queue",
      "Social media promotion",
      "Backlink badge required",
    ],
    button: "Choose Support",
    highlight: false,
    linkType: "dofollow (immediate)",
  },
  {
    id: "premium_launch",
    planId: "premium_launch",
    title: "Premium Launch",
    price: "$15",
    periodLabel: "/ launch",
    icon: Crown,
    features: [
      "List on homepage for a week",
      "Top position (more visibility)",
      "Regular, top 3 weekly position",
      "Guaranteed dofollow links",
      "Social media promotion",
      "Skip the queue",
      "Premium badge",
    ],
    button: "Choose Premium",
    highlight: true,
    linkType: "dofollow (guaranteed)",
  },
];

function PlanSelectionStep({ onPlanSelect, selectedPlan }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-medium text-gray-900 mb-2">
          Choose Your Launch Plan
        </h2>
        <p className="text-lg text-gray-900 mb-8">
          Select the plan that best fits your needs and budget
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            onPlanSelect={onPlanSelect}
            isSelected={selectedPlan === plan.id}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Need more information about our plans?
        </p>
        <Link to="/pricing" className="text-blue-600 hover:underline">
          View detailed pricing comparison
        </Link>
      </div>
    </div>
  );
}

export default PlanSelectionStep;
