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
      <div className="max-w-7xl mt-5 mx-auto px-4 py-4 relative">
        {/* Logo on the left */}
        <div className="flex items-center justify-start">
          <Image
            src="/images/logos/logoFT.png"
            alt="FineTuned Performance Logo"
            width={120}
            height={50}
            className="object-contain"
          />
        </div>

        {/* Social Icons centered absolutely */}
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-6">
            <a href="#" className="p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaFacebook className="text-black hover:text-white text-2xl" />
            </a>
            <a href="#" className="p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaInstagram className="text-black hover:text-white text-2xl" />
            </a>
            <a href="#" className="p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaTwitter className="text-black hover:text-white text-2xl" />
            </a>
            <a href="#" className="p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaGooglePlus className="text-black hover:text-white text-2xl" />
            </a>
            <a href="#" className="p-3 bg-white rounded-full hover:bg-gray-900 transition duration-500">
              <FaYoutube className="text-black hover:text-white text-2xl" />
            </a>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="mb-5">
          <ul className="flex justify-center space-x-8 text-lg">
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">Home</a></li>
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">News</a></li>
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">About</a></li>
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">Contact Us</a></li>
            <li><a href="#" className="hover:opacity-100 opacity-70 transition duration-500">Our Team</a></li>
          </ul>
        </nav>
      </div>

      {/* Bottom copyright */}
      <div className="bg-black py-4 text-center">
        <p className="text-white">
          Copyright &copy; 2025; Designed by{' '}
          <span className="opacity-70 uppercase tracking-wider">FineTuned Performance</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
