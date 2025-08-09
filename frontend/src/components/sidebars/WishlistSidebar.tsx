"use client";
import React from "react";
import Sidebar from "../ui/Sidebar";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import StarRating from "../ui/StarRating";
import VectorIcon from "../VectorIcon";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
  rating: number;
}

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock wishlist data
const mockWishlistItems: WishlistItem[] = [
  {
    id: "0",
    name: "Premium Wireless Headphones",
    price: 149.99,
    originalPrice: 199.99,
    image: "/api/placeholder/80/80",
    inStock: true,
    rating: 4.3,
  },
  {
    id: "1",
    name: "Smart Fitness Tracker",
    price: 89.99,
    image: "/api/placeholder/80/80",
    inStock: true,
    rating: 4.2,
  },
  {
    id: "2",
    name: "Professional Camera Lens",
    price: 549.99,
    image: "/api/placeholder/80/80",
    inStock: false,
    rating: 4.9,
  },
  {
    id: "3",
    name: "Wireless Gaming Mouse",
    price: 79.99,
    originalPrice: 99.99,
    image: "/api/placeholder/80/80",
    inStock: true,
    rating: 3.7,
  },
  {
    id: "4",
    name: "USB-C Hub",
    price: 45.99,
    image: "/api/placeholder/80/80",
    inStock: true,
    rating: 4.5,
  },
  {
    id: "5",
    name: "Ergonomic Office Chair",
    price: 299.99,
    originalPrice: 399.99,
    image: "/api/placeholder/80/80",
    inStock: true,
    rating: 4.6,
  },
  {
    id: "6",
    name: "Bluetooth Speaker",
    price: 129.99,
    originalPrice: 149.99,
    image: "/api/placeholder/80/80",
    inStock: true,
    rating: 4.3,
  },
];

const WishlistSidebar: React.FC<WishlistSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const [wishlistItems, setWishlistItems] =
    React.useState<WishlistItem[]>(mockWishlistItems);

  const removeFromWishlist = (id: string) => {
    setWishlistItems(wishlistItems.filter((item) => item.id !== id));
  };

  const addToCart = (item: WishlistItem) => {
    // Add to cart logic here
    console.log("Adding to cart:", item);
    // Optionally remove from wishlist after adding to cart
    // removeFromWishlist(item.id);
  };

  const moveAllToCart = () => {
    const inStockItems = wishlistItems.filter((item) => item.inStock);
    inStockItems.forEach((item) => addToCart(item));
  };

  return (
    <Sidebar isOpen={isOpen} onClose={onClose} title="My Wishlist">
      <div className="flex flex-col h-full">
        {wishlistItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="flex justify-center w-full">
                <VectorIcon name="heart" className="text-8xl text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-gray-500 mb-4">
                Save items you love for later
              </p>
              <Button variant="brand" onClick={onClose}>
                Start Shopping
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Wishlist Header Actions */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {wishlistItems.length} item
                  {wishlistItems.length > 1 ? "s" : ""}
                </p>
                <Button
                  variant="outline-brand"
                  size="sm"
                  onClick={moveAllToCart}
                  disabled={!wishlistItems.some((item) => item.inStock)}
                >
                  Add All to Cart
                </Button>
              </div>
            </div>

            {/* Wishlist Items */}
            <div
              className="flex-1 overflow-y-auto scrollbar-hide"
              style={{ minHeight: "200px" }}
            >
              <div className="p-4 space-y-4">
                {wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>

                      {/* Rating */}
                      <div className="mt-1 flex items-center space-x-1">
                        <StarRating
                          rating={item.rating}
                          size="sm"
                          showRating={true}
                        />
                      </div>

                      {/* Price */}
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                        )}
                        {item.originalPrice && (
                          <span className="text-xs text-green-600 font-medium">
                            Save ${(item.originalPrice - item.price).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex space-x-2">
                        <Button
                          variant="brand"
                          size="sm"
                          onClick={() => addToCart(item)}
                          disabled={!item.inStock}
                          className="flex-1"
                        >
                          {item.inStock
                            ? "Add to Cart"
                            : "Notify When Available"}
                        </Button>
                      </div>
                    </div>

                    <IconButton
                      iconName="close"
                      onClick={() => removeFromWishlist(item.id)}
                      buttonClassName="text-gray-400 hover:text-red-500 transition-colors text-xl"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Wishlist Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <Button
                variant="outline-brand"
                onClick={onClose}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
};

export default WishlistSidebar;
