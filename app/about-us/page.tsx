'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Target, Eye } from 'lucide-react';

export default function AboutUsPage() {
  const router = useRouter();
  const handleGetStarted = () => router.push('/app');

  const teamMembers = [
    { name: 'Alex Doe', role: 'Founder & Seller-in-Chief', bio: 'With 5+ years of experience selling on platforms like Meesho, Alex founded SellerAnalytics to solve the problems they faced every day.' },
    { name: 'Jane Smith', role: 'Lead Developer', bio: 'Jane is the architect behind our privacy-first, in-browser processing engine, ensuring the tool is both powerful and secure.' },
    { name: 'Sam Wilson', role: 'UX & Community Manager', bio: 'Sam is dedicated to making the tool as intuitive as possible and loves hearing feedback from fellow sellers.' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header onGetStarted={handleGetStarted} />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">About SellerAnalytics</h1>
            <p className="text-xl text-gray-600">
              Our mission is to empower online sellers with clear, actionable data insights, completely free of charge.
            </p>
          </div>
          
          <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-gray-200/50 space-y-8">
            <div className="prose lg:prose-xl mx-auto text-gray-700">
              <h3>Our Story</h3>
              <p>
                We started as online sellers ourselves, navigating the complexities of e-commerce platforms like Meesho. We quickly realized one of the biggest challenges was understanding our own profitability. Between various fees, shipping costs, returns, and RTOs, it was incredibly difficult to know if we were actually making money.
              </p>
              <p>
                We spent countless hours wrestling with messy Excel sheets, trying to consolidate data from different reports. We knew there had to be a better way. That’s why we built SellerAnalytics.
              </p>
              <blockquote>
                "We built the tool we always wished we had. Simple, powerful, and 100% focused on helping sellers succeed."
              </blockquote>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-gray-700">
              <div className="flex items-start gap-4">
                <Target className="w-12 h-12 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-bold text-gray-800">Our Mission</h4>
                  <p>To provide every Meesho seller, regardless of size, with free, enterprise-level analytics to make data-driven decisions and grow their business profitably.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Eye className="w-12 h-12 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-bold text-gray-800">Our Vision</h4>
                  <p>A future where every online entrepreneur has the tools and confidence to turn their passion into a sustainable and successful business.</p>
                </div>
              </div>
            </div>
            
            <div className="prose lg:prose-xl mx-auto text-gray-700">
                <h3>Privacy at our Core</h3>
                <p>
                  Our tool is built on a foundation of privacy and security. All your data is processed locally in your browser—it never touches our servers. We believe that your business data is yours alone, and we've designed our architecture to respect that.
                </p>
            </div>
            
             <div className="pt-8 border-t border-gray-200">
                <h3 className="text-3xl font-bold text-gray-800 text-center mb-8">Meet the (Fictional) Team</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {teamMembers.map(member => (
                        <div key={member.name} className="text-center">
                            <div className="mx-auto bg-gradient-to-br from-green-100 to-blue-100 h-24 w-24 rounded-full mb-4"></div>
                            <h4 className="font-bold text-lg text-gray-800">{member.name}</h4>
                            <p className="text-green-600 font-semibold text-sm mb-2">{member.role}</p>
                            <p className="text-gray-500 text-sm">{member.bio}</p>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
