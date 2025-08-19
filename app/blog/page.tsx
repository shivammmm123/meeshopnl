'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAllPosts } from '@/lib/blog';

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const router = useRouter();
  const handleGetStarted = () => router.push('/app');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header onGetStarted={handleGetStarted} />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">SellerAnalytics Blog</h1>
            <p className="text-lg text-gray-600">Tips, tricks, and insights to help you grow your e-commerce business.</p>
          </div>
          
          <div className="space-y-8">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block p-8 bg-white rounded-2xl shadow-lg border border-gray-200/50 transition-all duration-300 hover:shadow-xl hover:border-green-300 hover:scale-[1.02]">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 hover:text-green-600 transition-colors">{post.title}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  By {post.author} on {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-gray-600">{post.excerpt}</p>
                <span className="mt-4 inline-block text-green-600 font-semibold hover:underline">Read More →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}