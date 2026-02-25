"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-white">
              Exhibit<span className="text-[#00aaff]">XR</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="#usecases" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Anwendungen
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Preise
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <Link
              href="/register"
              className="bg-[#00aaff] hover:bg-[#0088cc] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-[0_0_15px_rgba(0,170,255,0.4)] hover:shadow-[0_0_25px_rgba(0,170,255,0.6)]"
            >
              Kostenlos starten
            </Link>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={`md:hidden ${isOpen ? "block" : "hidden"}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <Link
            href="#features"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsOpen(false)}
          >
            Features
          </Link>
          <Link
            href="#usecases"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsOpen(false)}
          >
            Anwendungen
          </Link>
          <Link
            href="#pricing"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsOpen(false)}
          >
            Preise
          </Link>
          <div className="pt-4 pb-2">
            <Link
              href="/register"
              className="block w-full text-center bg-[#00aaff] text-white px-5 py-3 rounded-md font-medium"
              onClick={() => setIsOpen(false)}
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
