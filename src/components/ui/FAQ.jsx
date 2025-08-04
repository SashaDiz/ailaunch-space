import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

function FAQ({ faqs }) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {faqs.map((faq, idx) => (
        <AccordionItem
          key={idx}
          value={`item-${idx}`}
          className="border rounded-lg transition duration-300 hover:border-gray-900 last:border-b-1"
        >
          <AccordionTrigger className="w-full cursor-pointer font-medium text-lg text-left px-6 py-5 flex justify-between items-center transition duration-300 hover:no-underline">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-5 text-md text-gray-900">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default FAQ;
