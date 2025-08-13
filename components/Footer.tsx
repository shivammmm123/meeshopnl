import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-center py-8 bg-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} Seller Analytics. All Rights Reserved.</p>
            <p className="text-xs text-gray-500 mt-2">A free tool to help Meesho sellers grow their business.</p>
        </div>
    </footer>
  );
};

export default Footer;
