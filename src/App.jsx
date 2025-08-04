import React from "react";
import { Routes, Route } from "react-router-dom";
import { SessionProvider } from "./contexts/SessionContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { AppDetailPage } from "./pages/AppDetailPage";
import { SubmitAppPage } from "./pages/SubmitAppPage";
import { PastLaunchesPage } from "./pages/PastLaunchesPage";
import { FAQPage } from "./pages/FAQPage";
import { ContactPage } from "./pages/ContactPage";
import { TermsPage } from "./pages/TermsPage";
import { SignInPage } from "./pages/SignInPage";
import { VerifyRequestPage } from "./pages/VerifyRequestPage";
import PricingPage from "./pages/PricingPage";
import "./App.css";

function App() {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app/:id" element={<AppDetailPage />} />
            <Route path="/submit" element={<SubmitAppPage />} />
            <Route path="/submit/payment-success" element={<SubmitAppPage />} />
            <Route path="/past-launches" element={<PastLaunchesPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/verify-request" element={<VerifyRequestPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/pricing" element={<PricingPage />} />{" "}
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </SessionProvider>
  );
}

export default App;
