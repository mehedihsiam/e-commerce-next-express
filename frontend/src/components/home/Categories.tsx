import React from "react";
import { Card, CardContent } from "../ui/Card";

const categories = [
  {
    id: 1,
    name: "Electronics",
    icon: "📱",
    productCount: "2,500+",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    name: "Fashion",
    icon: "👗",
    productCount: "3,200+",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: 3,
    name: "Home & Garden",
    icon: "🏠",
    productCount: "1,800+",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: 4,
    name: "Sports & Outdoor",
    icon: "⚽",
    productCount: "1,200+",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: 5,
    name: "Beauty & Health",
    icon: "💄",
    productCount: "950+",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    id: 6,
    name: "Books & Media",
    icon: "📚",
    productCount: "2,100+",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    id: 7,
    name: "Automotive",
    icon: "🚗",
    productCount: "800+",
    gradient: "from-gray-500 to-slate-500",
  },
  {
    id: 8,
    name: "Toys & Games",
    icon: "🎮",
    productCount: "1,500+",
    gradient: "from-red-500 to-pink-500",
  },
];

const Categories: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our wide range of products across various categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer transition-all duration-300 hover:scale-105 group"
              hover
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${category.gradient} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}
                >
                  {category.icon}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {category.productCount} products
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
            View All Categories
            <svg
              className="ml-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Categories;
