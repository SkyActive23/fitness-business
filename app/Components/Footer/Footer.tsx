// components/Footer.tsx
import React from 'react';
import Image from 'next/image';
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaGooglePlus,
  FaYoutube,
} from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 w-full text-white relative overflow-hidden">
      <div className="max-w-7xl mt-5 mx-auto px-4 py-4 relative flex flex-col sm:block items-center sm:items-start gap-6">
        
        {/* Logo */}
        <div className="sm:static flex justify-center sm:justify-start mb-4 sm:mb-0">
          <Image
            src="/images/logos/logoFT.png"
            alt="FineTuned Performance Logo"
            width={120}
            height={50}
            className="object-contain"
          />
        </div>

        {/* Social Icons */}
        <div className="sm:absolute sm:top-5 sm:left-1/2 sm:transform sm:-translate-x-1/2">
          <div className="flex flex-wrap justify-center sm:justify-center space-x-4 sm:space-x-6">
            <a href="#" className="p-2 sm:p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaFacebook className="text-black hover:text-white text-xl sm:text-2xl" />
            </a>
            <a href="#" className="p-2 sm:p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaInstagram className="text-black hover:text-white text-xl sm:text-2xl" />
            </a>
            <a href="#" className="p-2 sm:p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaTwitter className="text-black hover:text-white text-xl sm:text-2xl" />
            </a>
            <a href="#" className="p-2 sm:p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaGooglePlus className="text-black hover:text-white text-xl sm:text-2xl" />
            </a>
            <a href="#" className="p-2 sm:p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaYoutube className="text-black hover:text-white text-xl sm:text-2xl" />
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="w-full mt-6 sm:mt-5">
          <ul className="flex flex-wrap justify-center sm:justify-center space-x-4 sm:space-x-8 text-base sm:text-lg">
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">Home</a></li>
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">News</a></li>
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">About</a></li>
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">Contact Us</a></li>
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">Our Team</a></li>
          </ul>
        </nav>
      </div>

      {/* Bottom copyright */}
      <div className="bg-black py-4 text-center text-sm sm:text-base">
        <p className="text-white">
          &copy; 2025 FineTuned Performance — All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
