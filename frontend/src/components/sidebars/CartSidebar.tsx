"use client";
import React from "react";
import Sidebar from "../ui/Sidebar";
import Button from "../ui/Button";
import Image from "next/image";
import IconButton from "../ui/IconButton";
import VectorIcon from "../VectorIcon";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock cart data
const mockCartItems: CartItem[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    price: 99.99,
    image: "/api/placeholder/80/80",
    quantity: 1,
    color: "Black",
  },
  {
    id: "2",
    name: "Smart Watch Series 5",
    price: 299.99,
    image: "/api/placeholder/80/80",
    quantity: 2,
    color: "Silver",
    size: "42mm",
  },
  {
    id: "3",
    name: "Premium Coffee Beans",
    price: 24.99,
    image: "/api/placeholder/80/80",
    quantity: 1,
  },
  {
    id: "4",
    name: "Premium Coffee Beans",
    price: 24.99,
    image: "/api/placeholder/80/80",
    quantity: 1,
  },
  {
    id: "5",
    name: "Premium Coffee Beans",
    price: 24.99,
    image: "/api/placeholder/80/80",
    quantity: 1,
  },
  {
    id: "6",
    name: "Premium Coffee Beans",
    price: 24.99,
    image: "/api/placeholder/80/80",
    quantity: 1,
  },
  {
    id: "7",
    name: "Premium Coffee Beans",
    price: 24.99,
    image: "/api/placeholder/80/80",
    quantity: 1,
  },
];

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = React.useState<CartItem[]>(mockCartItems);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter((item) => item.id !== id));
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + shipping;

  return (
    <Sidebar isOpen={isOpen} onClose={onClose} title="Shopping Cart">
      <div className="flex flex-col h-full">
        {cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="flex justify-center w-full">
                <VectorIcon name="cart" className="text-8xl text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-500 mb-4">
                Add some products to get started
              </p>
              <Button variant="brand" onClick={onClose}>
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div
              className="flex-1 overflow-y-auto scrollbar-hide"
              style={{ minHeight: "200px" }}
            >
              <div className="p-4 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <Image
                      height={150}
                      width={150}
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <div className="mt-1 space-y-1">
                        {item.color && (
                          <p className="text-xs text-gray-500">
                            Color: {item.color}
                          </p>
                        )}
                        {item.size && (
                          <p className="text-xs text-gray-500">
                            Size: {item.size}
                          </p>
                        )}
                        <p className="text-sm font-medium text-gray-900">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <IconButton
                      iconName="close"
                      onClick={() => removeItem(item.id)}
                      buttonClassName="text-gray-400 hover:text-red-500 transition-colors text-xl"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping === 0 ? (
                  <p className="text-xs text-green-600">
                    🎉 You qualify for free shipping!
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Add ${(100 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between text-base font-medium border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="brand" className="w-full">
                  Proceed to Checkout
                </Button>
                <Button
                  variant="outline-brand"
                  onClick={onClose}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
};

export default CartSidebar;
