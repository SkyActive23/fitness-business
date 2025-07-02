"use client";

import Image from "next/image";
import { Navbar } from "@/app/Components/Nav/Navbar";
import Footer from "../Components/Footer/Footer";
import FloatingContactButton from "../Components/FloatingContactButton/FloatingContactButton";

export default function AboutPage() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white">
      
      {/* Navbar */}
      <header className="row-start-1">
        <Navbar />
      </header>

      {/* Main Content */}
      <main className="row-start-2 flex flex-col items-center px-4 py-10 sm:px-12 sm:py-16">

        {/* Logo & Hero Title */}
        <div className="flex flex-col mt-20 items-center mb-12 text-center">
          <div className="relative w-full max-w-md aspect-[4/3] bg-slate-800 mb-8 rounded-lg shadow-2xl flex items-center justify-center px-4">
            <Image
              src="/images/logos/logoFT.png"
              alt="FineTuned Logo"
              fill
              className="object-contain"
            />
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">
            About FineTuned Performance
          </h1>
          <p className="mt-4 text-lg sm:text-2xl font-medium drop-shadow-md max-w-2xl">
            Elevating athletic potential through evidence-based strength, speed, and power training.
          </p>
        </div>

        {/* Divider */}
        <hr className="border-t border-4 rounded-full border-slate-200 w-4/5 mx-auto my-12" />

        {/* Mission Section */}
        <section className="w-full bg-slate-800 mt-8 rounded-lg py-10 px-4 sm:px-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
            {/* Image */}
            <div className="w-full md:w-1/2">
              <Image
                src="/images/heartbeats.jpg"
                alt="Mission and Vision"
                className="w-full h-auto rounded-lg shadow-lg object-cover"
                width={600}
                height={400}
              />
            </div>

            {/* Text */}
            <div className="w-full md:w-1/2 text-left sm:text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Our Mission</h2>
              <p className="text-base sm:text-xl leading-relaxed text-slate-200">
                At FineTuned Performance, we help athletes unlock their peak performance by training smarter.
                Our programs fuse modern science, individualized coaching, and elite-level experience to build
                athletes who dominate their game.
              </p>
            </div>
          </div>
        </section>

        {/* Who We Train Section */}
        <section className="w-full bg-slate-800 rounded-lg py-10 mt-12 px-4 sm:px-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
            {/* Text */}
            <div className="w-full md:w-1/2 text-left sm:text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Who We Train</h2>
              <p className="text-base sm:text-xl leading-relaxed text-slate-200">
                We work with youth athletes, collegiate players, professionals, and dedicated weekend warriors.
                Whether you&apos;re preparing for your season, a combine, or lifelong fitness — we&apos;ve got a plan for you.
              </p>
            </div>

            {/* Image */}
            <div className="w-full md:w-1/2">
              <Image
                src="/images/whowetrain.jpg"
                alt="Athletes Training"
                className="w-full h-auto rounded-lg shadow-lg object-cover"
                width={600}
                height={400}
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-t border-4 rounded-full border-slate-200 w-4/5 mx-auto my-12" />

        {/* Coach Bios */}
        <section className="w-full max-w-6xl px-4 sm:px-0 mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Meet the Coaches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Coach 1 */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl text-center hover:scale-105 active:scale-95 transition-transform duration-300">
              <Image
                src="/images/profile/Skyler.jpg"
                alt="Coach Skyler"
                width={160}
                height={160}
                className="mx-auto rounded-full mb-4 object-cover"
              />
              <h3 className="text-2xl font-bold mb-2">Skyler Hollingsworth, CSCS</h3>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                A decade in high-performance training, former Strength Coach at The MMA LAB and current Strength and Conditioning Coach at Glendale Community College. Specializing in strength, speed, and injury resilience for elite and emerging athletes. Holds a Bachelor&apos;s Degree in Exercise Science with an emphasis on Sport Performance from Arizona State University.
              </p>
            </div>

            {/* Coach 2 */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl text-center hover:scale-105 active:scale-95 transition-transform duration-300">
              <Image
                src="/images/coach-jane.jpg"
                alt="Coach Mike"
                width={160}
                height={160}
                className="mx-auto rounded-full mb-4 object-cover"
              />
              <h3 className="text-2xl font-bold mb-2">Michael Woods, CSCS</h3>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                Former collegiate football player at Glendale Community College and current Strength and Conditioning Coach at GCC. Michael brings a competitive edge and a deep understanding of athletic performance to his coaching. He holds a Bachelor&apos;s Degree in Kinesiology from Concordia University Chicago and is dedicated to developing strength, power, and resilience in athletes at all levels.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Contact Button */}
      <FloatingContactButton />

      {/* Footer */}
      <footer className="row-start-3 w-full flex gap-6 py-4 items-center justify-center">
        <Footer />
      </footer>
    </div>
  );
}
