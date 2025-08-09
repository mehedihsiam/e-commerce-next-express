"use client";

import React from "react";
import Button from "../ui/Button";

const Hero: React.FC = () => {
  return (
    <section className="relative bg-brand text-white overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Discover Amazing
              <span className="block text-yellow-400">Products</span>
              <span className="block">Every Day</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl">
              Shop from thousands of products with unbeatable prices and fast
              delivery. Your satisfaction is our priority.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                Shop Now
              </Button>
              <Button
                size="lg"
                variant="outline-accent"
                className="border-white text-white hover:bg-white hover:text-gray-900"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">
                  10K+
                </div>
                <div className="text-sm text-gray-200">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">
                  50K+
                </div>
                <div className="text-sm text-gray-200">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">
                  99%
                </div>
                <div className="text-sm text-gray-200">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Hero Image/Visual */}
          <div className="relative">
            <div className="relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="w-12 h-12 bg-yellow-400 rounded-lg mb-4"></div>
                    <h3 className="font-semibold text-lg mb-2">Electronics</h3>
                    <p className="text-sm text-gray-200">
                      Latest gadgets & tech
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                    <div className="w-12 h-12 bg-green-400 rounded-lg mb-4"></div>
                    <h3 className="font-semibold text-lg mb-2">Fashion</h3>
                    <p className="text-sm text-gray-200">Trendy styles</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                    <div className="w-12 h-12 bg-red-400 rounded-lg mb-4"></div>
                    <h3 className="font-semibold text-lg mb-2">
                      Home & Garden
                    </h3>
                    <p className="text-sm text-gray-200">Beautiful spaces</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                    <div className="w-12 h-12 bg-purple-400 rounded-lg mb-4"></div>
                    <h3 className="font-semibold text-lg mb-2">Sports</h3>
                    <p className="text-sm text-gray-200">Active lifestyle</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-400/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" className="w-full h-12 text-white">
          <path
            d="M0,96L48,90.7C96,85,192,75,288,80C384,85,480,107,576,112C672,117,768,107,864,101.3C960,96,1056,96,1152,90.7L1200,85L1200,120L1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
