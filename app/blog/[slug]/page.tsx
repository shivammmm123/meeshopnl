'use client';
import React from 'react';
import { notFound, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAllPosts, getPostBySlug } from '@/lib/blog';

interface PostPageProps {
  params: {
    slug: string;
  };
}

// NOTE: generateStaticParams still works with client components.
// It tells Next.js which pages to pre-build at build time.
// The component itself will then hydrate and run on the client.

export default function PostPage({ params }: PostPageProps) {
  const post = getPostBySlug(params.slug);
  const router = useRouter();
  const handleGetStarted = () => router.push('/app');

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header onGetStarted={handleGetStarted} />
      <main className="flex-grow container mx-auto px-4 py-16">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{post.title}</h1>
          <p className="text-md text-gray-500 mb-8">
            By {post.author} on {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div 
            className="prose lg:prose-xl mx-auto text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}