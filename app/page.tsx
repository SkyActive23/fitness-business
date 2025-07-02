"use client";

import { useState } from "react";
import Image from "next/image";
import Carousel from "@/app/Components/Carousel/Carousel";
import Contact from "@/app/Components/Contact/Contact";
import { Navbar } from "@/app/Components/Nav/Navbar";
import Footer from "./Components/Footer/Footer";
import FloatingContactButton from "./Components/FloatingContactButton/FloatingContactButton";
import BackgroundLogo from "./Components/LogoBackground/LogoBackground";

export default function Home() {
  const [activeCard, setActiveCard] = useState<null | "strength" | "power" | "speed">(null);

  const handleToggle = (card: typeof activeCard) => {
    if (window.innerWidth < 768) {
      setActiveCard(prev => (prev === card ? null : card));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-gray-400 to-slate-500 text-white font-[family-name:var(--font-geist-sans)] overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <div className="relative w-full h-[350px] sm:h-[500px]">
        <Image
          src="/images/track.jpg"
          alt="Track"
          fill
          className="object-cover opacity-45"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-white text-3xl sm:text-6xl font-extrabold drop-shadow-lg">
            FineTuned Performance
          </h1>
          <Image
            src="/images/logos/logo.png"
            alt="FineTuned Logo"
            width={120}
            height={60}
            className="object-contain mt-2 sm:mt-4"
          />
          <h4 className="text-white text-lg sm:text-4xl mt-2 sm:mt-6 drop-shadow-3xl font-bold">
            Strength • Power • Speed
          </h4>
        </div>
      </div>

      {/* Carousel */}
      <section className="w-full pt-4 pb-4 sm:pt-5 sm:pb-5 bg-slate-800 shadow-lg">
        <Carousel />
      </section>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center gap-8 sm:gap-16 px-4 py-8 sm:px-20 sm:py-12 w-full overflow-x-hidden">
        {/* Welcome Section */}
        <section className="text-center max-w-prose">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Welcome to FineTuned Performance</h1>
          <p className="text-base sm:text-2xl leading-relaxed mb-8">
            At FineTuned Performance, we specialize in helping athletes unlock their full potential. Through science-driven training, we enhance strength, power, and speed to prepare you for peak performance — every game, every season.
          </p>
        </section>

        {/* Strength, Power, Speed */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 w-full max-w-6xl text-center px-2 sm:px-4">
          {[
            {
              id: "strength",
              title: "Strength",
              image: "/images/strength.jpg",
              text: "Build foundational power with resistance-based methods that enhance muscle function, joint stability, and force production."
            },
            {
              id: "power",
              title: "Power",
              image: "/images/power.jpg",
              text: "Train explosive strength through Olympic lifts, plyometrics, and sport-specific high-intensity movements."
            },
            {
              id: "speed",
              title: "Speed",
              image: "/images/sprint.jpg",
              text: "Increase your velocity, reaction time, and agility with drills focused on mechanics and multidirectional explosiveness."
            }
          ].map(({ id, title, image, text }) => (
            <div
              key={id}
              className="relative h-[200px] sm:h-[300px] rounded-xl overflow-hidden shadow-lg group cursor-pointer"
              onClick={() => handleToggle(id as typeof activeCard)}
            >
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover opacity-40 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-4 left-0 right-0 text-center z-10">
                <h3 className="text-2xl sm:text-4xl font-extrabold drop-shadow-md">{title}</h3>
              </div>
              <div
                className={`
                  absolute inset-0 bg-slate-800 bg-opacity-60 flex flex-col items-center justify-center 
                  px-4 sm:px-6 transition-opacity duration-300
                  ${activeCard === id ? "opacity-100" : "opacity-0"} 
                  group-hover:opacity-100
                `}
              >
                <BackgroundLogo opacity={0.1} size={300} position="center" />
                <p className="text-sm sm:text-xl font-semibold">{text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Floating Contact Button */}
        <FloatingContactButton />

        {/* Contact Section */}
        <section id="contact" className="text-center max-w-prose px-2 sm:px-0 w-full">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-base sm:text-2xl leading-relaxed mb-8">
            Have questions or want to learn more about our training programs? Fill out the form below and we&apos;ll get back to you as soon as possible.
          </p>
          <Contact />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-slate-900 text-white py-4">
        <Footer />
      </footer>
    </div>
  );
}
