'use client';

import React, { useState, useEffect } from 'react'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';

export const Navbar = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          </div>
        </div>
      </div>
    </>
  );
};
