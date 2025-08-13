

import React, { useState, useEffect, useRef } from 'react';
import { BarChartBig, ShieldCheck, TrendingUp, UploadCloud, CheckCircle, BarChart, FileText, HelpCircle, ArrowRight, DollarSign, Target, Clock, Quote, Sparkles, LockKeyhole, BrainCircuit, GitCompareArrows, XCircle, Video, Users, Store, GraduationCap, Rocket, Heart, Smartphone, CheckSquare, BookOpen, Award, BarChart2, Briefcase, UserCheck, Mail, Box as BoxIcon } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface LandingPageProps {
  onStart: () => void;
  onShowRedesigned: () => void;
}

// --- Reusable Animated Section Wrapper ---
const useOnScreen = (ref: React.RefObject<HTMLElement>, rootMargin = '0px') => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const currentRef = ref.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(currentRef!);
                }
            },
            { rootMargin: '-100px' }
        );
        
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if(currentRef) {
                observer.disconnect();
            }
        };
    }, [ref, rootMargin]);

    return isVisible;
};

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
const AccordionItem = ({ q, a }: { q: string, a: string }) => {
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
        <Header onStart={onStart} />

        {/* Hero Section */}
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
        <SectionWrapper className="py-24 px-8 bg-white">
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

        {/* How It Works Section */}
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
                    <img src="https://i.imgur.com/q2yBwAR.png" alt="Dashboard Preview" className="rounded-b-lg w-full" />
                </div>
            </div>
        </SectionWrapper>

        {/* "Why" Section */}
        <SectionWrapper className="py-24 px-8 bg-gray-50/70">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-4xl font-bold text-gray-900 leading-tight">Stop Guessing, Start Growing</h2>
                    <p className="mt-4 text-lg text-gray-600">This tool empowers you to move beyond guesswork and make strategic decisions based on real data from your own store.</p>
                    <ul className="mt-8 space-y-6">
                       {growthPoints.map((point, index) => (
                         <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">{point.icon}</div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-800">{point.title}</h3>
                                <p className="mt-1 text-gray-600">{point.description}</p>
                            </div>
                         </li>
                       ))}
                    </ul>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200/80 hover:shadow-2xl transition-all duration-300 hover:bg-gray-50">
                    <div className="bg-white rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-gray-700">Profitability by SKU</h4>
                            <span className="text-xs font-semibold text-green-600 bg-green-100 py-1 px-2 rounded-full">Live Data</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 w-20 truncate">SKU-A-01</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-5"><div className="bg-green-500 h-5 rounded-full" style={{width: '90%'}}></div></div>
                                <span className="text-sm font-bold w-12 text-right text-green-700">+₹4.5k</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 w-20 truncate">SKU-B-02</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-5"><div className="bg-green-500 h-5 rounded-full" style={{width: '75%'}}></div></div>
                                <span className="text-sm font-bold w-12 text-right text-green-700">+₹3.1k</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 w-20 truncate">SKU-C-03</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-5"><div className="bg-red-500 h-5 rounded-full" style={{width: '20%'}}></div></div>
                                <span className="text-sm font-bold w-12 text-right text-red-600">-₹820</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 w-20 truncate">SKU-D-04</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-5"><div className="bg-green-500 h-5 rounded-full" style={{width: '60%'}}></div></div>
                                <span className="text-sm font-bold w-12 text-right text-green-700">+₹2.4k</span>
                            </div>
                        </div>
                    </div>
                     <p className="text-center text-xs text-gray-400 mt-4">This is a visual representation. Your actual dashboard will be more detailed.</p>
                </div>
            </div>
        </SectionWrapper>

        {/* Old Way vs Smart Way */}
        <SectionWrapper className="py-24 px-8 bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold text-gray-900">Tired of Manual Calculations?</h2>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    {/* The Old Way */}
                    <div className="bg-red-50/50 p-8 rounded-2xl border-2 border-dashed border-red-200 transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-red-200/50 hover:-translate-y-2 transform">
                        <div className="flex items-center gap-3 mb-4">
                            <GitCompareArrows size={24} className="text-red-500"/>
                            <h3 className="text-2xl font-bold text-red-800">The Old Way</h3>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3"><XCircle size={20} className="text-red-500 mt-1 flex-shrink-0" /><span>Hours spent wrestling with complex Excel formulas.</span></li>
                            <li className="flex items-start gap-3"><XCircle size={20} className="text-red-500 mt-1 flex-shrink-0" /><span>High risk of errors leading to incorrect profit figures.</span></li>
                            <li className="flex items-start gap-3"><XCircle size={20} className="text-red-500 mt-1 flex-shrink-0" /><span>Hidden costs like RTO fees and claims are easily missed.</span></li>
                            <li className="flex items-start gap-3"><XCircle size={20} className="text-red-500 mt-1 flex-shrink-0" /><span>No clear, visual way to spot trends or problem products.</span></li>
                        </ul>
                    </div>
                    {/* The Smart Way */}
                    <div className="bg-green-50/50 p-8 rounded-2xl border-2 border-dashed border-green-300 transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-green-200/50 hover:-translate-y-2 transform">
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles size={24} className="text-green-500"/>
                            <h3 className="text-2xl font-bold text-green-800">The Smart Way</h3>
                        </div>
                         <ul className="space-y-3">
                            <li className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" /><span>Instant, automated profit analysis in seconds.</span></li>
                            <li className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" /><span>100% accuracy by processing raw data directly.</span></li>
                            <li className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" /><span>Full breakdown of every cost for complete clarity.</span></li>
                            <li className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" /><span>Beautiful charts and dashboards to guide your decisions.</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </SectionWrapper>
        
        {/* NEW: Who Is This Tool For? */}
        <SectionWrapper className="py-24 px-8 bg-white">
             <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900">Built for Every Stage of Your Journey</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">Whether you're just starting or scaling up, our tool provides the clarity you need.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 hover:bg-gray-100">
                        <div className="inline-block p-4 bg-white rounded-full mb-4 shadow-md"><UserCheck size={32} className="text-green-500"/></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">The New Seller</h3>
                        <p className="text-gray-600">Just starting out? Get a clear understanding of your numbers from day one and avoid common financial mistakes.</p>
                    </div>
                    <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 hover:bg-gray-100">
                        <div className="inline-block p-4 bg-white rounded-full mb-4 shadow-md"><Briefcase size={32} className="text-blue-500"/></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">The Growing Business</h3>
                        <p className="text-gray-600">As your orders grow, our tool helps you spot trends, identify profitable products, and optimize your operations for scale.</p>
                    </div>
                    <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 hover:bg-gray-100">
                        <div className="inline-block p-4 bg-white rounded-full mb-4 shadow-md"><Award size={32} className="text-purple-500"/></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">The Established Brand</h3>
                        <p className="text-gray-600">Make strategic, data-backed decisions. Perform deep dives into SKU profitability and market-wise performance.</p>
                    </div>
                </div>
            </div>
        </SectionWrapper>

        {/* NEW: Video Walkthrough */}
        <SectionWrapper className="py-24 px-8 bg-gray-800 text-white">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold">See It in Action</h2>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-300">Watch this 2-minute walkthrough to see how you can go from messy spreadsheets to clear insights in no time.</p>
                <div className="mt-12 aspect-video bg-black/50 rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer group hover:bg-black/70 transition-colors">
                    <div className="p-8 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                       <Video size={64} className="text-white"/>
                    </div>
                </div>
            </div>
        </SectionWrapper>
        
        {/* REPLACED: Your Business, By the Numbers */}
        <SectionWrapper className="py-24 px-8 bg-white">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold text-gray-900">Your Business, By the Numbers</h2>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">
                    We've engineered a powerful core that handles vast amounts of data with ease, giving you unmatched analytical depth.
                </p>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 bg-green-50 border-2 border-green-200 rounded-2xl hover:bg-green-100 transition-colors duration-300">
                        <p className="text-5xl font-extrabold text-green-600">20+</p>
                        <p className="mt-2 text-lg font-semibold text-gray-700">Key Metrics Tracked</p>
                    </div>
                    <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors duration-300">
                        <p className="text-5xl font-extrabold text-blue-600">100k+</p>
                        <p className="mt-2 text-lg font-semibold text-gray-700">Orders Analyzed</p>
                    </div>
                     <div className="p-8 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-colors duration-300">
                        <p className="text-5xl font-extrabold text-purple-600">&lt;60s</p>
                        <p className="mt-2 text-lg font-semibold text-gray-700">Results in Seconds</p>
                    </div>
                </div>
            </div>
        </SectionWrapper>
        
        {/* Testimonials Section */}
        <SectionWrapper className="py-24 px-8 bg-gray-50/70">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900">Loved by Sellers Like You</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">
                        Don't just take our word for it. Here's what Meesho sellers are saying about our tool.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <TestimonialCard 
                        quote="This tool is a game-changer! I used to spend my entire Sunday on Excel. Now I get a full profit report in two minutes. I finally have my weekends back."
                        author="Anjali S."
                        role="Fashion & Apparel Seller"
                    />
                     <TestimonialCard 
                        quote="I had no idea how much money I was losing on returns for one specific SKU. This dashboard made it crystal clear. I've since discontinued that product and my profits are up 20%."
                        author="Rohan M."
                        role="Home & Kitchen Supplier"
                    />
                     <TestimonialCard 
                        quote="As a new seller, I was completely lost with the numbers. Your tool is so simple and visual. It gave me the confidence to understand my business and make smarter decisions."
                        author="Priya K."
                        role="Electronics & Accessories Seller"
                    />
                </div>
            </div>
        </SectionWrapper>
        
        {/* Privacy Section */}
        <SectionWrapper className="py-24 px-8 bg-white">
            <div className="max-w-4xl mx-auto text-center">
                <LockKeyhole size={48} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-4xl font-bold text-gray-900">Your Data Stays Yours. Period.</h2>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">
                    We built this tool with a "privacy-first" approach. All your sensitive business data is processed directly in your web browser. Nothing is ever uploaded or saved to our servers.
                </p>
                <div className="mt-12 p-8 bg-white/80 rounded-2xl shadow-xl border border-gray-200 hover:bg-white transition-all duration-300">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-gray-700">
                        <div className="text-center">
                            <div className="p-4 bg-green-100 rounded-full inline-block"><UploadCloud size={32} className="text-green-600"/></div>
                            <p className="mt-2 font-semibold">1. You Upload File</p>
                            <p className="text-sm text-gray-500">From your computer</p>
                        </div>
                        <ArrowRight size={32} className="text-gray-300 hidden md:block" />
                         <div className="text-center">
                            <div className="p-4 bg-blue-100 rounded-full inline-block"><BrainCircuit size={32} className="text-blue-600"/></div>
                            <p className="mt-2 font-semibold">2. Processing Happens</p>
                            <p className="text-sm text-gray-500">Locally in your browser</p>
                        </div>
                        <ArrowRight size={32} className="text-gray-300 hidden md:block" />
                        <div className="text-center">
                            <div className="p-4 bg-purple-100 rounded-full inline-block"><BarChartBig size={32} className="text-purple-600"/></div>
                            <p className="mt-2 font-semibold">3. Dashboard Appears</p>
                            <p className="text-sm text-gray-500">Only you can see it</p>
                        </div>
                    </div>
                </div>
            </div>
        </SectionWrapper>
        
        {/* NEW: Feature Checklist */}
        <SectionWrapper className="py-24 px-8 bg-gray-50/70">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                   <CheckSquare className="mx-auto w-12 h-12 text-green-500 mb-4" />
                   <h2 className="text-4xl font-bold text-center">Everything You Get, For Free</h2>
                   <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">A complete list of the powerful features and metrics available in your dashboard.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
                    {featureChecklist.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>

        {/* NEW: Meesho Glossary */}
        <SectionWrapper className="py-24 px-8 bg-white">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                   <BookOpen className="mx-auto w-12 h-12 text-blue-500 mb-4" />
                   <h2 className="text-4xl font-bold text-center">Understand the Jargon</h2>
                   <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">We help you make sense of the key terms in your Meesho reports.</p>
                </div>
                <dl className="space-y-6">
                    {glossaryTerms.map(item => (
                        <div key={item.term} className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors duration-300">
                            <dt className="text-lg font-semibold text-gray-800">{item.term}</dt>
                            <dd className="mt-2 text-gray-600">{item.def}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </SectionWrapper>
        
        {/* NEW: What's Next? (Roadmap) */}
        <SectionWrapper className="py-24 px-8 bg-gray-800 text-white">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <Rocket className="mx-auto w-12 h-12 text-green-400 mb-4" />
                    <h2 className="text-4xl font-bold text-center">Constantly Evolving For You</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-300">We're committed to your growth. Here's a peek at the exciting new features currently in development.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {roadmapItems.map(item => (
                        <div key={item.title} className="p-8 bg-gray-700/50 rounded-2xl border border-gray-600 text-center hover:bg-gray-700 transition-colors duration-300">
                            <div className="inline-block p-4 bg-gray-800 rounded-full mb-4">{item.icon}</div>
                            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-gray-400">{item.description}</p>
                            <span className="mt-4 inline-block text-xs font-bold text-cyan-400 bg-cyan-900/50 py-1 px-3 rounded-full">COMING SOON</span>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>
        
        {/* NEW: Our Mission */}
        <SectionWrapper className="py-24 px-8 bg-white">
            <div className="max-w-3xl mx-auto text-center">
                <Heart className="mx-auto w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-4xl font-bold text-gray-900">Our Mission is Simple</h2>
                <p className="mt-4 text-lg text-gray-600">
                    "We started as online sellers too, and we know how hard it is to figure out if you're actually making money. We built this tool to give every Meesho seller, big or small, the power of data clarity. It's free because we believe that when small businesses have the right tools, everyone wins."
                </p>
                <p className="mt-6 font-semibold text-gray-700">- The SellerAnalytics Team</p>
            </div>
        </SectionWrapper>
        
        {/* NEW: Mobile-First Analytics */}
        <SectionWrapper className="py-24 px-8 bg-gray-50/70">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="relative mx-auto w-80 h-[34rem] bg-gray-800 rounded-[3rem] p-4 shadow-2xl border-4 border-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-xl"></div>
                    <div className="h-full w-full bg-white rounded-[2rem] overflow-hidden">
                        <img src="https://i.imgur.com/uJgGsGo.png" alt="Dashboard on Mobile" className="w-full h-full object-cover object-top" />
                    </div>
                </div>
                <div className="text-center md:text-left">
                    <Smartphone size={32} className="text-green-500 mb-4 mx-auto md:mx-0"/>
                    <h2 className="text-4xl font-bold text-gray-900 leading-tight">Your Business in Your Pocket</h2>
                    <p className="mt-4 text-lg text-gray-600">Don't be tied to your desk. Our fully responsive design means you can access your complete analytics dashboard on any device, anytime, anywhere.</p>
                </div>
            </div>
        </SectionWrapper>
        
        {/* FAQ Section */}
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
