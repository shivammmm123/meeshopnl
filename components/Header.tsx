'use client';
import React from 'react';
import Link from 'next/link';

interface HeaderProps {
    onGetStarted: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGetStarted }) => {
    const navItems = [
      { name: 'Features', href: '/#features' },
      { name: 'About Us', href: '/about-us' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Blog', href: '/blog' },
      { name: 'How to use', href: '/how-to-use' },
    ];

    return (
        <header className="py-4 px-6 md:px-8 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 shadow-sm">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">
                Seller<span className="font-light">Analytics</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
                {navItems.map(item => (
                    <Link key={item.name} href={item.href} className="text-gray-600 font-medium hover:text-green-600 transition-colors duration-300">{item.name}</Link>
                ))}
            </nav>
            <button onClick={onGetStarted} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:scale-105 transition-transform duration-300">
                Get Started
            </button>
        </header>
    );
};

export default Header;