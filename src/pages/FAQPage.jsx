import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export function FAQPage() {
  const faqs = [
    {
      question: "How does the weekly launch system work?",
      answer:
        "Every week, directories can participate in our launch. During this period, community members vote for their favorite directories. At the end of the week, the top 3 directories with the most votes become winners and receive special benefits including badges and dofollow backlinks.",
    },
    {
      question: "What are the benefits of winning?",
      answer:
        "Winners receive: (1) A permanent high authority lifetime backlink to their website, (2) A downloadable winner badge to display on their site, (3) Featured placement in our past launches archive. The top 3 ranking products get badges and dofollow backlinks.",
    },
    {
      question: "What is a Premium Launch?",
      answer:
        "For $15, you can get a Premium Launch that includes: top position for more visibility, 3+ guaranteed high authority lifetime backlinks, social media promotion, ability to skip the queue, and a premium badge.",
    },
    {
      question: "Can I submit multiple directories?",
      answer:
        "Yes, you can submit multiple directories, but each directory requires a separate submission. If you want guaranteed placement and benefits, consider using Premium Launch or Support Launch options.",
    },
    {
      question: "What types of directories can I submit?",
      answer:
        "We accept all types of directories and curated collections including: business directories, resource lists, tool collections, startup directories, and any other organized collection of websites or services.",
    },
    {
      question: "What are the different launch options?",
      answer:
        "We offer three options: (1) Standard Launch (Free) - live on homepage for a month with weekly entry, (2) Support Launch (Requires backlink) - includes guaranteed backlink and social promotion, (3) Premium Launch ($15) - top position, 3+ backlinks, skip queue, and premium badge.",
    },
    {
      question: "How does the voting system work?",
      answer:
        "Each visitor can vote once per directory during the active launch period. Voting determines the weekly and monthly winners. The system tracks votes in real-time and winners are determined by the highest vote counts.",
    },
    {
      question: "What about the dofollow/nofollow links?",
      answer:
        "During the launch period, links may be nofollow. However: (1) Premium Launch directories always get dofollow links, (2) Support Launch directories get guaranteed dofollow backlinks, (3) Top 3 weekly winners get dofollow backlinks and badges.",
    },
    {
      question: "How do I get the winner badge?",
      answer:
        "If your directory wins (top 3), we'll provide you with a downloadable winner badge and embed code. Display this badge on your website to showcase your achievement and maintain your dofollow link status.",
    },
    {
      question: "Can I edit my submission after submitting?",
      answer:
        "Currently, you cannot edit submissions after they're published. Please review all information carefully before submitting. If you need to make changes, contact us and we'll help you update the information.",
    },
    {
      question: "When will my directory go live?",
      answer:
        "Standard and Support launches go live at the start of their launch period (12:00 AM PST). Premium launches can skip the queue and get published faster after approval, which typically takes 1-2 business days.",
    },
    {
      question: "Is DirectoryHunt.org free to use?",
      answer:
        "Yes! We offer a free Standard Launch option where your directory will be live on the homepage for a month and entered in the weekly competition. Paid options provide additional benefits like guaranteed backlinks and priority placement.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 flex flex-col items-center">
      {/* Header */}
      <div className="text-center flex flex-col items-center">
        <span className="flex items-center border px-4 pr-5 py-2 rounded-lg mb-4 text-sm">
          <HelpCircle className="inline w-4 h-4 mr-1" />
          FAQ
        </span>
        <h2 className="text-5xl font-medium text-gray-900 mb-3">
          How it Works
        </h2>
        <p className="text-md text-gray-900">
          Everything you need to know about DirectoryHunt.org
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col items-center justify-center gap-1 bg-white border rounded-lg p-6">
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            color="#000000"
          >
            <path
              d="M12 12C15.866 12 19 8.86599 19 5H5C5 8.86599 8.13401 12 12 12ZM12 12C15.866 12 19 15.134 19 19H5C5 15.134 8.13401 12 12 12Z"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M5 2L12 2L19 2"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M5 22H12L19 22"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <div className="text-4xl font-semibold text-gray-900">30</div>
          <div className="text-sm text-gray-600">Days on Homepage</div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 bg-white border rounded-lg p-6">
          <svg
            width="20px"
            height="20px"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            color="#000000"
          >
            <path
              d="M20 20H4V4"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M4 16.5L12 9L15 12L19.5 7.5"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <div className="text-4xl font-semibold text-gray-900">DR22</div>
          <div className="text-sm text-gray-600">Backlink Authority</div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 bg-white border rounded-lg p-6">
          <svg
            width="20px"
            height="20px"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            color="#000000"
          >
            <path
              d="M15 21H9V12.6C9 12.2686 9.26863 12 9.6 12H14.4C14.7314 12 15 12.2686 15 12.6V21Z"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M20.4 21H15V18.1C15 17.7686 15.2686 17.5 15.6 17.5H20.4C20.7314 17.5 21 17.7686 21 18.1V20.4C21 20.7314 20.7314 21 20.4 21Z"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M9 21V16.1C9 15.7686 8.73137 15.5 8.4 15.5H3.6C3.26863 15.5 3 15.7686 3 16.1V20.4C3 20.7314 3.26863 21 3.6 21H9Z"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M10.8056 5.11325L11.7147 3.1856C11.8314 2.93813 12.1686 2.93813 12.2853 3.1856L13.1944 5.11325L15.2275 5.42427C15.4884 5.46418 15.5923 5.79977 15.4035 5.99229L13.9326 7.4917L14.2797 9.60999C14.3243 9.88202 14.0515 10.0895 13.8181 9.96099L12 8.96031L10.1819 9.96099C9.94851 10.0895 9.67568 9.88202 9.72026 9.60999L10.0674 7.4917L8.59651 5.99229C8.40766 5.79977 8.51163 5.46418 8.77248 5.42427L10.8056 5.11325Z"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <div className="text-4xl font-semibold text-gray-900">3</div>
          <div className="text-sm text-gray-600">Winners per Week</div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 bg-white border rounded-lg p-6">
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            color="#000000"
          >
            <path
              d="M16 13C13.2386 13 11 11.8807 11 10.5C11 9.11929 13.2386 8 16 8C18.7614 8 21 9.11929 21 10.5C21 11.8807 18.7614 13 16 13Z"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M11 14.5C11 15.8807 13.2386 17 16 17C18.7614 17 21 15.8807 21 14.5"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M3 9.5C3 10.8807 5.23858 12 8 12C9.12583 12 10.1647 11.814 11.0005 11.5"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M3 13C3 14.3807 5.23858 15.5 8 15.5C9.12561 15.5 10.1643 15.314 11 15.0002"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M3 5.5V16.5C3 17.8807 5.23858 19 8 19C9.12563 19 10.1643 18.8139 11 18.5"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M13 8.5V5.5"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M11 10.5V18.5C11 19.8807 13.2386 21 16 21C18.7614 21 21 19.8807 21 18.5V10.5"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M8 8C5.23858 8 3 6.88071 3 5.5C3 4.11929 5.23858 3 8 3C10.7614 3 13 4.11929 13 5.5C13 6.88071 10.7614 8 8 8Z"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <div className="text-4xl font-semibold text-gray-900">$15</div>
          <div className="text-sm text-gray-600">Premium Launch</div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-8 max-w-[700px]">
        {faqs.map((faq, index) => (
          <div key={index}>
            <CardHeader>
              <CardTitle className="flex font-semibold items-start space-x-3 text-xl">
                <svg
                  width="20px"
                  height="20px"
                  strokeWidth="1.5"
                  className="mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  color="#000000"
                >
                  <path
                    d="M8 12H12M16 12H12M12 12V8M12 12V16"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                <span>{faq.question}</span>
              </CardTitle>
            </CardHeader>
            <p className="text-gray-700 leading-relaxed pl-14">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
