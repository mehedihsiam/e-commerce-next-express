import React from "react";
import { Card, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

const products = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    price: 79.99,
    originalPrice: 99.99,
    image: "/api/placeholder/300/300",
    rating: 4.5,
    reviews: 128,
    badge: "Best Seller",
    badgeColor: "success" as const,
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    price: 199.99,
    originalPrice: 249.99,
    image: "/api/placeholder/300/300",
    rating: 4.7,
    reviews: 89,
    badge: "New",
    badgeColor: "info" as const,
  },
  {
    id: 3,
    name: "Organic Cotton T-Shirt",
    price: 24.99,
    originalPrice: 34.99,
    image: "/api/placeholder/300/300",
    rating: 4.3,
    reviews: 156,
    badge: "Sale",
    badgeColor: "error" as const,
  },
  {
    id: 4,
    name: "Premium Coffee Maker",
    price: 89.99,
    originalPrice: 119.99,
    image: "/api/placeholder/300/300",
    rating: 4.6,
    reviews: 73,
    badge: "Hot Deal",
    badgeColor: "warning" as const,
  },
  {
    id: 5,
    name: "Wireless Gaming Mouse",
    price: 45.99,
    originalPrice: 59.99,
    image: "/api/placeholder/300/300",
    rating: 4.4,
    reviews: 92,
    badge: "Limited",
    badgeColor: "default" as const,
  },
  {
    id: 6,
    name: "Eco-Friendly Water Bottle",
    price: 19.99,
    originalPrice: 29.99,
    image: "/api/placeholder/300/300",
    rating: 4.2,
    reviews: 201,
    badge: "Eco",
    badgeColor: "success" as const,
  },
  {
    id: 7,
    name: "Portable Phone Charger",
    price: 29.99,
    originalPrice: 39.99,
    image: "/api/placeholder/300/300",
    rating: 4.5,
    reviews: 167,
    badge: "Popular",
    badgeColor: "info" as const,
  },
  {
    id: 8,
    name: "Ergonomic Office Chair",
    price: 159.99,
    originalPrice: 199.99,
    image: "/api/placeholder/300/300",
    rating: 4.8,
    reviews: 45,
    badge: "Premium",
    badgeColor: "default" as const,
  },
];

const ProductCard: React.FC<{ product: (typeof products)[0] }> = ({
  product,
}) => {
  const discountPercentage = Math.round(
    (1 - product.price / product.originalPrice) * 100
  );

  return (
    <Card className="group cursor-pointer" hover>
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative overflow-hidden rounded-t-xl">
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-lg">📷 Product Image</span>
          </div>

          {/* Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant={product.badgeColor} size="sm">
              {product.badge}
            </Badge>
          </div>

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 right-3">
              <Badge variant="error" size="sm">
                -{discountPercentage}%
              </Badge>
            </div>
          )}

          {/* Quick Actions */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
            <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-500">
              ({product.reviews})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                ${product.price}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button className="w-full" size="sm">
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FeaturedProducts: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our hand-picked selection of trending and popular products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
