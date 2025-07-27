import { Navbar } from '@/app/Components/Nav/Navbar';
import Footer from '@/app/Components/Footer/Footer';
import React from 'react';
import FloatingContactButton from '../Components/FloatingContactButton/FloatingContactButton';

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-slate-800 to-slate-500 text-white">
      <header>
        <Navbar />
      </header>


      <main className="flex-grow">{children}</main>
      
      <FloatingContactButton />
      
      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
}
