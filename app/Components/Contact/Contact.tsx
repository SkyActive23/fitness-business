// components/ContactForm.tsx
'use client';

import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

const ContactForm = () => {
  const form = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.current) return;

    emailjs.sendForm(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        form.current,
        process.env.NEXT_PUBLIC_EMAILJS_USER_ID!
      )
      .then(
        (result) => {
          console.log('Email sent:', result.text);
          setSubmitted(true);
          form.current?.reset();
        },
        (error) => {
          console.error('Email error:', error.text);
        }
      );
  };

  return (
    <div className="w-full bg-slate-800 rounded-2xl mx-auto p-4 text-white">
      <h2 className="text-2xl font-semibold mb-4">Contact Form</h2>
      {submitted ? (
        <p className="text-green-400">Thank you! Your message has been sent.</p>
      ) : (
        <form ref={form} onSubmit={sendEmail} className="space-y-4 pr-5 pl-5">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            required
            className="w-full border text-white bg-slate-600 p-2 rounded"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            required
            className="w-full border text-white bg-slate-600 p-2 rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            required
            className="w-full border text-white bg-slate-600 p-2 rounded"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            required
            className="w-full border text-white bg-slate-600 p-2 rounded"
          />
          <button
            type="submit"
            className="bg-slate-600 text-2xl font-bold hover:bg-slate-300 text-white hover:text-slate-800 py-2 px-10 rounded"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactForm;
