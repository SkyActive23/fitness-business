'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faInfoCircle, faCog, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';

export const Navbar = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  if (!isMounted) return null;

  return (
    <>
      <div className='w-full bg-slate-800 text-white fixed top-0 left-0 z-50'>
        <div className='container mx-auto p-2 flex items-center justify-between'>

          {/* Logo on the left */}
          <div className='flex items-center'>
            <Image
              src='/images/logos/logoFT.png'
              alt='FineTuned Performance Logo'
              width={60}
              height={60}
              className='mr-2'
            />
          </div>

          {/* Navigation buttons on the right */}
          <div className='flex items-center space-x-4'>
            <Link href='/' className='hover:bg-slate-500 text-xl p-2 rounded flex items-center'>
              <FontAwesomeIcon icon={faHome} className='mr-2' />
              Home
            </Link>

            <Link href='/about' className='hover:bg-slate-500 text-xl p-2 rounded flex items-center'>
              <FontAwesomeIcon icon={faInfoCircle} className='mr-2' />
              About
            </Link>

            {/* <Link href='/Settings' className='hover:bg-slate-500 text-xl p-2 rounded flex items-center'>
              <FontAwesomeIcon icon={faCog} className='mr-2' />
              Settings
            </Link> */}
          </div>


          {/* Sports Dropdown */}
          {/* <div className='relative'>
            <button
              className='hover:bg-blue-500 text-xl p-2 rounded flex items-center'
              onClick={handleDropdown}
            >
              Sports
              <FontAwesomeIcon icon={faChevronDown} className='ml-2' />
            </button>
            {isDropdownOpen && (
              <div className='absolute mt-2 w-40 bg-slate-800 rounded shadow-lg'>
                {['Baseball', 'Football', 'Basketball', 'Softball', 'Volleyball', 'Track', 'Soccer'].map((sport, index) => (
                  <button
                    key={index}
                    className='block w-full text-left px-4 py-2 hover:bg-blue-500 rounded'
                    onClick={() => console.log(`${sport} clicked!`)}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            )}
          </div> */}

        </div>
      </div>

      {/* Full-width banner image (outside navbar) */}
      {/* <div className="relative w-full h-[500px]">
        <Image
          src="/images/track.jpg"
          alt="Track"
          fill
          className="object-cover opacity-45"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-slate-800 text-4xl sm:text-6xl font-bold drop-shadow-lg">
            FineTuned Performance
          </h1>
        </div>
      </div> */}
    </>
  );
};
