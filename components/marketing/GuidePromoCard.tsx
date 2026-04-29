import React from "react";
import Image from "next/image";
import PromoButton from "./PromoButton";

const GuidePromoCard = ({
  imageSrc,
  name,
  subtitle,
  title,
  description,
  buttonText,
  buttonLink,
}) => (
  <div className="rounded-2xl border border-border p-6 max-w-xl bg-card">
    <div className="flex items-center mb-4">
      <Image src={imageSrc} alt={name} width={64} height={64} className="w-16 h-16 object-cover mr-4 rounded-md" />
      <div>
        <div className="font-medium text-lg leading-none mb-1">{name}</div>
        <div className="text-muted-foreground text-sm">{subtitle}</div>
      </div>
    </div>
    <div className="mb-4">
      <div className="font-medium text-lg leading-6 mb-2">{title}</div>
      <div className="text-foreground text-sm">{description}</div>
    </div>
    <PromoButton href={buttonLink}>{buttonText}</PromoButton>
  </div>
);

export default GuidePromoCard;
