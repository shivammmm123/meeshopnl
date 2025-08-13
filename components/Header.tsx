import React from 'react';

interface HeaderProps {
    onStart: () => void;
}

const Header: React.FC<HeaderProps> = ({ onStart }) => {
    const navItems = ['Features', 'About Us', 'Privacy Policy', 'Blog'];

    return (
        <header className="py-4 px-6 md:px-8 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 shadow-sm">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">
                Seller<span className="font-light">Analytics</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
                {navItems.map(item => (
                    <a key={item} href="#" className="text-gray-600 font-medium hover:text-green-600 transition-colors duration-300">{item}</a>
                ))}
            </nav>
            <button onClick={onStart} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:scale-105 transition-transform duration-300">
                Get Started
            </button>
        </header>
    );
};

export default Header;
