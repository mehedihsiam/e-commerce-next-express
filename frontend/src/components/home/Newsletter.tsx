import React from "react";
import Button from "../ui/Button";

const Newsletter: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay in the Loop
          </h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new
            products, exclusive deals, and special offers.
          </p>

          <form className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                Subscribe
              </Button>
            </div>
          </form>

          <p className="text-sm text-gray-200 mt-4">
            No spam, unsubscribe at any time. We respect your privacy.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center mt-8 space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm text-gray-200">Subscribers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Weekly</div>
              <div className="text-sm text-gray-200">Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Exclusive</div>
              <div className="text-sm text-gray-200">Deals</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
