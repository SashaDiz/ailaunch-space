import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Crown, Star, Gift } from "lucide-react";

const plans = [
  {
    id: "standard_launch",
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
    buttonText: "Choose Standard",
    highlight: false,
    linkType: "nofollow (dofollow for top 3)",
  },
  {
    id: "support_launch",
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
    buttonText: "Choose Support",
    highlight: false,
    linkType: "dofollow (immediate)",
  },
  {
    id: "premium_launch",
    title: "Premium Launch",
    price: "$15",
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
    buttonText: "Choose Premium",
    highlight: true,
    linkType: "dofollow (guaranteed)",
  },
];

function PlanSelectionStep({ onPlanSelect, selectedPlan }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Launch Plan
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Select the plan that best fits your needs and budget
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${
                plan.highlight
                  ? "border-blue-500 border-2"
                  : isSelected
                  ? "border-gray-400 border-2"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => onPlanSelect(plan.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{plan.title}</span>
                  </CardTitle>
                  {plan.highlight && <Badge variant="default">Popular</Badge>}
                </div>
                <div className="text-2xl font-bold">
                  {plan.price}
                  {plan.id === "premium_launch" && (
                    <span className="text-sm font-normal text-gray-600">
                      {" "}
                      / launch
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Links: {plan.linkType}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-sm"
                    >
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? "bg-blue-600 hover:bg-blue-700"
                      : isSelected
                      ? "bg-gray-800 hover:bg-gray-900"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanSelect(plan.id);
                  }}
                >
                  {isSelected ? "✓ Selected" : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          );
        })}
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
