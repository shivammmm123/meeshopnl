'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileText, UploadCloud, BarChart, HardDrive } from 'lucide-react';

const Step = ({ icon, title, children }: { icon: React.ReactNode, title: string, children?: React.ReactNode }) => (
    <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-lg border border-gray-200/50">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
            <div className="text-gray-600 space-y-3 prose">{children}</div>
        </div>
    </div>
);

export default function HowToUsePage() {
  const router = useRouter();
  const handleGetStarted = () => router.push('/app');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header onGetStarted={handleGetStarted} />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">How to Use the Tool</h1>
            <p className="text-lg text-gray-600">Get from raw reports to actionable insights in a few simple steps.</p>
          </div>
          
          <div className="space-y-8">
            <Step icon={<FileText size={40} className="text-green-600"/>} title="Step 1: Download Your Meesho Reports">
                <p>To begin, you need to download three specific reports from your Meesho Supplier Panel. It's crucial to get the right ones for the tool to work correctly.</p>
                <ol>
                    <li><strong>Payments Report:</strong> Go to <code>Payments</code> {'>'} <code>All Payments</code>. Set your desired date range and download the report. The tool specifically uses the sheet named <strong>"Order Payments"</strong> inside this Excel file.</li>
                    <li><strong>Orders Report:</strong> Go to <code>Orders</code> {'>'} <code>All Orders</code>. Export the complete order list for the same date range.</li>
                    <li><strong>Returns Report:</strong> Go to the <code>Returns</code> section and download your returns data, again for the same date range.</li>
                </ol>
                <blockquote><strong>Pro Tip:</strong> For a meaningful analysis, we recommend downloading reports covering the last 30 to 90 days.</blockquote>
            </Step>

            <Step icon={<UploadCloud size={40} className="text-blue-600"/>} title="Step 2: Upload Your Files">
                <p>Once you have the files, head back to our tool and click "Get Started" to reach the upload page.</p>
                <ul>
                    <li>You will see three upload boxes for Payments, Orders, and Returns.</li>
                    <li>Click on each box and select the corresponding file you downloaded from your computer.</li>
                    <li>You can upload one, two, or all three files. The more files you provide, the more complete your analysis will be. For full profit/loss calculation, the <strong>Payments file is essential</strong>.</li>
                    <li>Remember, your files are processed instantly and securely in your browser. Nothing is uploaded to our servers.</li>
                </ul>
            </Step>
            
             <Step icon={<BarChart size={40} className="text-purple-600"/>} title="Step 3: Enter Costs & Analyze Your Dashboard">
                <p>For the most accurate profit analysis, you need to provide your product costs.</p>
                <ul>
                    <li>If you upload the Payments file, you will be automatically taken to a page where you can enter the cost price for each unique SKU found in your report.</li>
                    <li>This step is optional but <strong>highly recommended</strong> for true profitability insights. If you skip it, we can't calculate your net profit or margins.</li>
                    <li>Once you enter the costs (or skip), your interactive dashboard will be generated instantly!</li>
                    <li>Explore different tabs (Payments, Orders, Returns), use the filters to drill down into your data, and discover key insights about your business performance.</li>
                </ul>
                 <blockquote><strong>Pro Tip:</strong> Keep a separate spreadsheet of your SKUs and their costs to make this step faster next time!</blockquote>
            </Step>

             <Step icon={<HardDrive size={40} className="text-gray-600"/>} title="Bonus: Automatic Data Saving">
                <p>The tool automatically saves your processed data in your browser's local storage.</p>
                 <ul>
                    <li>This means you can close the tab and come back later, and your dashboard will be right where you left it—no need to re-upload files every time.</li>
                    <li>To clear your data and start fresh, go to the <strong>Settings</strong> tab in the dashboard and use the "Reset All Data" option.</li>
                </ul>
            </Step>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}