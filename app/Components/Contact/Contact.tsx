'use client';

const ContactForm = () => {
  return (
    <div className="w-full bg-slate-800 rounded-2xl mx-auto p-4">
      <h2 className="text-2xl text-white font-semibold mb-4">Contact Form</h2>

      <form
        // action="skyactivefitness@gmail.com"
        action="2949e27774309164b18379a696157ccc"
        method="POST"
        className="ml-8 mr-8 space-y-4"
      >
        {/* Disable CAPTCHA and optionally redirect after submit */}
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_next" value="http://localhost:3000/thank-you" />

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
          placeholder="Email"
          required
          className="w-full border text-white bg-slate-600 p-2 rounded"
        />

        <input
          type="text"
          name="sport"
          placeholder="Sport"
          required
          className="w-full border text-white bg-slate-600 p-2 rounded"
        />

        <textarea
          name="message"
          placeholder="Why are you reaching out?"
          rows={4}
          required
          className="w-full border text-white bg-slate-600 p-2 rounded"
        />

        <button
          type="submit"
          className="w-1/3 text-xl text-white font-medium bg-slate-600 py-2 rounded hover:bg-slate-400 hover:text-slate-800"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
