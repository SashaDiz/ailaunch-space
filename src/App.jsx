import React from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { AppDetailPage } from "./pages/AppDetailPage";
import { SubmitAppPage } from "./pages/SubmitAppPage";
import { PastLaunchesPage } from "./pages/PastLaunchesPage";
import { FAQPage } from "./pages/FAQPage";
import { TermsPage } from "./pages/TermsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { WebhookTestPage } from "./pages/WebhookTestPage";
import PricingPage from "./pages/PricingPage";
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app/:id" element={<AppDetailPage />} />
          <Route path="/past-launches" element={<PastLaunchesPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Authentication Routes */}
          <Route
            path="/sign-in"
            element={
              <PublicRoute>
                <SignInPage />
              </PublicRoute>
            }
          />
          <Route
            path="/sign-up"
            element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <SubmitAppPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit/payment-success"
            element={
              <ProtectedRoute>
                <SubmitAppPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId?"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Development/Testing Routes */}
          <Route
            path="/webhook-test"
            element={
              <ProtectedRoute>
                <WebhookTestPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
