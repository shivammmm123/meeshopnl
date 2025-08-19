'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BarChartBig, ShieldCheck, TrendingUp, UploadCloud, CheckCircle, BarChart, FileText, HelpCircle, ArrowRight, DollarSign, Target, Clock, Quote, Sparkles, LockKeyhole, BrainCircuit, GitCompareArrows, XCircle, Video, Users, Store, GraduationCap, Rocket, Heart, Smartphone, CheckSquare, BookOpen, Award, BarChart2, Briefcase, UserCheck, Mail, Box as BoxIcon } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useOnScreen } from '@/hooks/useOnScreen';

// --- Reusable Animated Section Wrapper ---
const SectionWrapper: React.FC<{children: React.ReactNode, className?: string} & React.HTMLAttributes<HTMLElement>> = ({ children, className = '', ...rest }) => {
    const ref = useRef(null);
    const isVisible = useOnScreen(ref);
    return (
        <section ref={ref} className={`${className} transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} {...rest}>
            {children}
        </section>
    );
};

// --- FAQ Component ---
interface AccordionItemProps {
  q: string;
  a: string;
}
const AccordionItem = ({ q, a }: AccordionItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 transition-all duration-300 hover:shadow-xl hover:border-green-300 hover:scale-[1.02]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-gray-800 focus:outline-none py-4 px-6"
            >
                <span className="font-semibold text-lg">{q}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                   <p className="pt-0 pb-4 px-6 text-gray-600 pr-8">{a}</p>
                </div>
            </div>
        </div>
    );
};

// --- Testimonial Card Component ---
const TestimonialCard: React.FC<{ quote: string; author: string; role: string }> = ({ quote, author, role }) => (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200/80 flex flex-col h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 hover:bg-white/80">
        <Quote className="w-10 h-10 text-green-400 mb-4" />
        <p className="text-gray-600 flex-grow mb-4">"{quote}"</p>
        <div>
            <p className="font-bold text-gray-800">{author}</p>
            <p className="text-sm text-gray-500">{role}</p>
        </div>
    </div>
);

interface LandingPageProps {
  onStart: () => void;
  onShowRedesigned: () => void;
}

// --- Landing Page ---
const LandingPage: React.FC<LandingPageProps> = ({ onStart, onShowRedesigned }) => {
  
  const faqs = [
    { q: "What is this tool and how will it help me?", a: "This is a free analytics tool specially designed for Meesho suppliers. You can easily see your real profit and loss by uploading your sales, orders, and returns Excel reports. It tells you which products are selling the most and which are being returned the most." },
    { q: "Is this tool free to use?", a: "Yes, this tool is completely free. Our goal is to help small and new Meesho sellers better understand their business." },
    { q: "How secure is my data?", a: "Your data is 100% secure. All processing happens right in your computer's browser. None of your files or data are uploaded or stored on our servers." },
    { q: "Which files do I need to upload?", a: "You need to download 3 reports from the Meesho Supplier Panel: Payments Report (specifically the 'Order Payment' sheet), Orders Report, and Returns Report." },
    { q: "What is RTO (Return to Origin) and how does this tool handle it?", a: "RTO means when an order cannot be delivered to the customer and comes back to you. Our tool tracks RTO orders separately and includes the loss incurred from them in your profit calculation." },
  ];

  const features = [
      { icon: <BarChartBig className="w-10 h-10 text-green-500" />, title: "Instant Profit Analysis", description: "Automatically calculate net profit, margins, and all hidden costs from your reports." },
      { icon: <ShieldCheck className="w-10 h-10 text-blue-500" />, title: "100% Secure & Private", description: "Your files are processed locally in your browser. No data ever leaves your computer." },
      { icon: <TrendingUp className="w-10 h-10 text-purple-500" />, title: "Identify Top Products", description: "Discover which products are most profitable and which have high return rates." },
      { icon: <FileText className="w-10 h-10 text-orange-500" />, title: "Comprehensive Reports", description: "Analyze payments, orders, and returns all in one place for a complete business overview." },
  ];

  const steps = [
      { icon: <FileText size={40} className="text-green-600"/>, title: "Download Reports", description: "Get your Payments, Orders, and Returns reports from the Meesho Supplier Panel." },
      { icon: <UploadCloud size={40} className="text-green-600"/>, title: "Upload Files", description: "Upload one or more files into our secure, in-browser tool to start the analysis." },
      { icon: <BarChart size={40} className="text-green-600"/>, title: "Get Insights", description: "Instantly see your dashboard with profit calculations, charts, and actionable insights." },
  ];
  
  const growthPoints = [
      { icon: <DollarSign size={24} className="text-red-500"/>, title: "Uncover Hidden Costs", description: "Find out where your money is really going, from shipping fees to return penalties." },
      { icon: <Target size={24} className="text-blue-500"/>, title: "Make Data-Driven Decisions", description: "Know which products to re-stock, which to discontinue, and where to focus your efforts." },
      { icon: <Clock size={24} className="text-purple-500"/>, title: "Save Hours of Manual Work", description: "No more tedious spreadsheet formulas. Get instant results and save time for what matters." },
  ];

  const featureChecklist = [
    "Net Profit Calculation", "Gross Margin %", "Net Margin %", "RTO Rate & Cost Tracking",
    "SKU-Level Profitability", "State-wise Sales Distribution", "Top Selling Products", "Top Returned Products",
    "Return Reason Analysis", "Order Status Breakdown", "Daily Sales Trends", "Cost of Goods Sold (COGS)",
    "Packaging Cost Analysis", "Marketing Cost Input", "Data Filtering by Date/SKU", "Secure Local Processing"
  ];
  
  const glossaryTerms = [
    { term: "Settlement Value", def: "The final amount credited to your account by Meesho for an order after deducting their fees." },
    { term: "RTO (Return to Origin)", def: "When a package is returned to the seller before it reaches the customer, usually due to a failed delivery attempt." },
    { term: "COGS (Cost of Goods Sold)", def: "The direct costs of producing the goods sold by a company. For you, this is primarily your product cost + packaging cost." },
    { term: "Net Profit", def: "The actual profit after all expenses, including product costs, fees, and return costs, have been deducted from revenue." },
  ];
  
  const roadmapItems = [
    { icon: <BoxIcon size={32} className="text-blue-500"/>, title: "Inventory Management", description: "Track stock levels based on sales and get alerts for low-inventory items." },
    { icon: <Target size={32} className="text-purple-500"/>, title: "Ad Spend ROI", description: "Upload your advertising reports to see the true Return on Investment for your campaigns." },
    { icon: <Mail size={32} className="text-orange-500"/>, title: "Weekly Email Summaries", description: "Get a summary of your key business metrics delivered straight to your inbox." },
  ];

  return (
    <div className="bg-white text-gray-800 font-sans overflow-x-hidden">
        <Header onGetStarted={onStart} />
        <main className="text-center py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-200/50 rounded-full filter blur-3xl opacity-50"></div>
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-emerald-200/50 rounded-full filter blur-3xl opacity-50"></div>
            <div className="relative z-10">
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 animate-fade-in-down">Meesho Profit & Loss, Simplified.</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 animate-fade-in-up animation-delay-200">Stop guessing, start knowing. Upload your Meesho reports and get a clear, visual breakdown of your real earnings in seconds. 100% Free & Secure.</p>
                <div className="flex items-center justify-center flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
                    <button onClick={onStart} className="w-full sm:w-auto bg-green-600 text-white font-bold text-lg py-4 px-10 rounded-lg shadow-xl hover:scale-105 hover:bg-green-700 transition-all duration-300 transform flex items-center justify-center gap-2">
                        Start Analyzing Now <ArrowRight size={20}/>
                    </button>
                    <button onClick={onShowRedesigned} className="w-full sm:w-auto bg-white text-green-600 border border-green-600 font-bold text-lg py-4 px-10 rounded-lg shadow-lg hover:scale-105 hover:bg-green-50 transition-all duration-300 transform">
                        Preview Dashboard
                    </button>
                </div>
            </div>
        </main>

        {/* Features Section */}
        <SectionWrapper id="features" className="py-24 px-8 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900">Unlock Your Business Potential</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">
                        Our tool does the heavy lifting, so you can focus on what matters most: growing your business.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-gray-50/50 p-8 rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-green-200/50 hover:-translate-y-2 transition-all duration-300 hover:bg-gray-100">
                           <div className="mb-4 bg-white p-3 inline-block rounded-full shadow-md">{feature.icon}</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>
        
        <SectionWrapper className="py-24 px-8 bg-gray-50/70">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                   <Sparkles className="mx-auto w-12 h-12 text-green-500 mb-4" />
                   <h2 className="text-4xl font-bold text-center text-gray-900">All Features, At a Glance</h2>
                   <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">
                        Everything you need to get a 360-degree view of your business health.
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                    {featureChecklist.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>

         <SectionWrapper className="py-24 px-8 bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900">Get Started in 3 Simple Steps</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">
                       From raw data to a clear dashboard in under a minute.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                   {steps.map((step, index) => (
                       <div key={index} className="relative group">
                           <div className="p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 h-full group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 group-hover:bg-white">
                               <div className="mb-4 inline-block p-4 bg-green-100 rounded-full">{step.icon}</div>
                               <h3 className="text-2xl font-bold text-gray-800 mb-2">{step.title}</h3>
                               <p className="text-gray-600">{step.description}</p>
                           </div>
                           {index < steps.length - 1 && <div className="hidden md:block absolute top-1/2 -right-10 transform -translate-y-1/2 text-gray-300"><ArrowRight size={40}/></div>}
                       </div>
                   ))}
                </div>
            </div>
        </SectionWrapper>

        {/* REPLACED: Visualize Your Success Section */}
        <SectionWrapper className="py-24 px-8 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900">Visualize Your Success</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">
                        Go from raw Excel files to a beautiful, interactive dashboard. See all your key metrics in one place.
                    </p>
                </div>
                <div className="bg-gray-800 p-2 sm:p-4 rounded-2xl shadow-2xl shadow-gray-400/30">
                    <div className="flex items-center gap-2 p-3 border-b border-gray-700">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    {/* Using a static import for the image */}
                    <img src="/dashboard-preview.png" alt="Dashboard Preview" className="rounded-b-lg w-full" />
                </div>
            </div>
        </SectionWrapper>

        {/* ... other sections ... */}
        <SectionWrapper id="faq" className="py-24 px-8 bg-gray-50/70">
            <div className="max-w-4xl mx-auto p-8 sm:p-12 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 transition-all duration-300 hover:shadow-green-500/10">
                <div className="text-center mb-12">
                   <HelpCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
                   <h2 className="text-4xl font-bold text-center">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                      <AccordionItem key={index} q={faq.q} a={faq.a} />
                  ))}
                </div>
            </div>
        </SectionWrapper>
        <Footer />
    </div>
  );
};

export default LandingPage;