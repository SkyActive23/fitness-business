"use client";
import Image from "next/image";
import Carousel from "@/app/Components/Carousel/Carousel";
import Contact from "@/app/Components/Contact/Contact";
import { Navbar } from "@/app/Components/Nav/Navbar";
import Footer from "./Components/Footer/Footer";
import FloatingContactButton from "./Components/FloatingContactButton/FloatingContactButton";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] bg-gradient-to-r from-gray-400 to-slate-500 min-h-screen font-[family-name:var(--font-geist-sans)]">
      
      {/* Navbar */}
      <header className="row-start-1">
        <Navbar />

        {/* Banner image */}
        <div className="relative w-full h-[500px]">
          <Image
            src="/images/track.jpg"
            alt="Track"
            fill
            className="object-cover opacity-45"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h1 className="text-slate-800 text-6xl sm:text-6xl mt-8 font-extrabold drop-shadow-4xl">
              FineTuned Performance
            </h1>
            <Image
              src="/images/logos/logo.png"
              alt="FineTuned Logo"
              width={200}
              height={100}
              className="object-contain mt-4"
            />
            <h4 className="text-white text-4xl mt-6 drop-shadow-3xl font-bold">
              Strength • Power • Speed
            </h4>
          </div>
        </div>

        {/* Carousel */}
        <section className="w-full pt-5 pb-5 bg-slate-800 shadow-lg">
          <Carousel />
        </section>
      </header>

      {/* Main Content */}
      <main className="row-start-2 flex flex-col items-center gap-16 px-8 py-12 sm:px-20">
        
        {/* Welcome Section */}
        <section className="text-center max-w-4xl">
          <h1 className="text-3xl font-bold mb-4">Welcome to FineTuned Performance</h1>
          <p className="text-2xl mb-8">
            At FineTuned Performance, we specialize in helping athletes unlock their full potential. Through science-driven training, we enhance strength, power, and speed to prepare you for peak performance — every game, every season.
          </p>
        </section>

        {/* Strength, Speed, Power Sections */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl text-white text-center">
        {/* Strength */}
          <div className="relative h-[300px] rounded-xl overflow-hidden shadow-lg group">
            <Image
              src="/images/strength.jpg"
              alt="Strength"
              fill
              className="object-cover opacity-40 transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Always visible title */}
            <div className="absolute top-4 left-0 right-0 text-center z-10">
              <h3 className="text-4xl font-extrabold drop-shadow-md">Strength</h3>
            </div>

            {/* Hover-only description */}
            <div className="absolute inset-0 bg-slate-800 bg-opacity-60 flex flex-col items-center justify-center px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-xl font-semibold">
                Build foundational power with resistance-based methods that enhance muscle function, joint stability, and force production.
              </p>
            </div>
          </div>

          {/* Power */}
          <div className="relative h-[300px] rounded-xl overflow-hidden shadow-lg group">
            <Image
              src="/images/power.jpg"
              alt="Power"
              fill
              className="object-cover opacity-40 transition-transform duration-300 group-hover:scale-105"
            />
            
            <div className="absolute top-4 left-0 right-0 text-center z-10">
              <h3 className="text-4xl font-extrabold drop-shadow-md">Power</h3>
            </div>

            <div className="absolute inset-0 bg-slate-800 bg-opacity-60 flex flex-col items-center justify-center px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-xl font-semibold">
                Train explosive strength through Olympic lifts, plyometrics, and sport-specific high-intensity movements.
              </p>
            </div>
          </div>

          {/* Speed */}
          <div className="relative h-[300px] rounded-xl overflow-hidden shadow-lg group">
            <Image
              src="/images/sprint.jpg"
              alt="Speed"
              fill
              className="object-cover opacity-40 transition-transform duration-300 group-hover:scale-105"
            />
            
            <div className="absolute top-4 left-0 right-0 text-center z-10">
              <h3 className="text-4xl font-extrabold drop-shadow-md">Speed</h3>
            </div>

            <div className="absolute inset-0 bg-slate-800 bg-opacity-60 flex flex-col items-center justify-center px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-xl font-semibold">
                Increase your velocity, reaction time, and agility with drills focused on mechanics and multidirectional explosiveness.
              </p>
            </div>
          </div>

        </section>



        {/* Floating Contact Button */}
        <FloatingContactButton />

        {/* Contact Section */}
        <section id="contact" className="text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-2xl mb-8">
            Have questions or want to learn more about our training programs? Fill out the form below and we'll get back to you as soon as possible.
          </p>
          <Contact />
        </section>
      </main>

      {/* Footer */}
      <footer className="row-start-3 w-full flex gap-6 py-4 items-center justify-center">
        <Footer />
      </footer>
    </div>
  );
}
