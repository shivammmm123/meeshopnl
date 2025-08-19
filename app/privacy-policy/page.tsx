'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const handleGetStarted = () => router.push('/app');
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header onGetStarted={handleGetStarted} />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-gray-200/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="prose lg:prose-xl mx-auto text-gray-700">
            <h2>1. Our Commitment to Your Privacy</h2>
            <p>
                SellerAnalytics is designed with a "privacy-first" architecture. We are committed to being radically transparent about our approach to your data. Our core principle is simple: <strong>We do not collect, store, transmit, or have any access to your business data (sales, payments, returns, etc.).</strong> Your data is yours, and it never leaves your computer.
            </p>
            
            <h2>2. Data Processing Architecture</h2>
            <p>
              When you upload your Meesho report files (e.g., Payments, Orders, Returns), all processing and analysis happens entirely within your web browser on your own device.
            </p>
            <ul>
                <li><strong>No Server Uploads:</strong> Your files and the information within them are never uploaded to our servers or any third-party cloud storage.</li>
                <li><strong>In-Browser Processing:</strong> All calculations, chart generation, and data visualization are performed by JavaScript running locally in your browser.</li>
                <li><strong>Local Storage for Convenience:</strong> To improve your experience, the processed data is stored in your browser's own secure, local database (IndexedDB). This allows you to close the tab and revisit your dashboard later without needing to re-upload your files. This data remains on your computer and is not accessible by us or any other website.</li>
            </ul>

            <h2>3. Information We Collect (and What We Don't)</h2>
            <h4>Information We DO NOT Collect:</h4>
            <ul>
                <li>Any data from your uploaded reports (order details, payment amounts, customer information, SKUs, etc.).</li>
                <li>Personally Identifiable Information (PII) from you or your customers.</li>
                <li>Your business's performance metrics.</li>
            </ul>

            <h4>Information We DO Collect:</h4>
            <p>
              To maintain and improve the application, we collect a minimal amount of non-personal, anonymous data.
            </p>
             <ul>
                <li><strong>Anonymous Error Logs:</strong> If the application encounters a critical error, we may log anonymous technical details about the error (like an error message and a generic stack trace) to a third-party service (Supabase). This data contains <strong>no</strong> personally identifiable information or any of your business data. It is used solely for the purpose of identifying and fixing bugs.</li>
            </ul>
            
            <h2>4. Use of Cookies and Third-Party Services</h2>
            <ul>
                <li><strong>Cookies:</strong> We do not use cookies for tracking or user identification.</li>
                <li><strong>Google AdSense:</strong> We use Google AdSense to display advertisements on our website, which helps us keep this tool free for everyone. Google may use cookies to serve ads based on a user's prior visits to our website or other websites. You can opt out of personalized advertising by visiting Google's <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Ad Settings</a>.</li>
            </ul>

            <h2>5. Your Data Rights and Controls</h2>
            <p>
                You have complete control over your data. You can clear all data stored in your browser at any time by navigating to the "Settings" tab within the application and using the "Reset All Data" button. This action is irreversible and will permanently remove all stored data from your device.
            </p>
            
            <h2>6. Changes to This Privacy Policy</h2>
            <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. We encourage you to review this Privacy Policy periodically for any changes.
            </p>

            <h2>7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@example-seller-analytics.com">privacy@example-seller-analytics.com</a> (this is a placeholder email).</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
