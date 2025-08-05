import { SignUp } from "@clerk/clerk-react";

export function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Directory Hunt today
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp afterSignUpUrl="/" signInUrl="/sign-in" />
        </div>
      </div>
    </div>
  );
}
