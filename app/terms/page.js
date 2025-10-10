export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Terms & Conditions
      </h1>

      <div className="prose prose-lg max-w-none">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          1. Introduction
        </h2>
        <p className="text-gray-600 mb-6">
          Welcome to AI Launch Space. By using our service, you agree to these
          terms and conditions.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          2. Service Description
        </h2>
        <p className="text-gray-600 mb-6">
          AI Launch Space provides a platform for submitting and discovering
          AI projects. We help launch your AI tool to our community and
          provide valuable backlinks.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          3. User Responsibilities
        </h2>
        <p className="text-gray-600 mb-6">
          Users are responsible for providing accurate information about their
          AI projects and ensuring they own or have permission to submit the
          project.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          4. Payment Terms
        </h2>
        <p className="text-gray-600 mb-6">
          Payment is required before submission processing begins. All sales are
          final, though we offer revisions if needed.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          5. Contact Information
        </h2>
        <p className="text-gray-600 mb-6">
          For questions about these terms, please contact us at{" "}
          <a
            href="mailto:hello@ailaunchspace.com"
            className="text-blue-600 hover:text-blue-700"
          >
            hello@ailaunchspace.com
          </a>
        </p>
      </div>
    </div>
  );
}
