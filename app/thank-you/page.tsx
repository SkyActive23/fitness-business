'use client';

// app/thank-you/page.tsx
import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import router from 'next/router';


export default function ThankYouPage() {

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000); // 5 seconds
  
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Thank you!</h1>
        <p className="text-lg">Your message has been sent. We'll get back to you soon.</p>
        <a
          href="/"
          className="inline-block mt-4 bg-slate-600 px-6 py-2 rounded hover:bg-slate-400 hover:text-slate-900"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
