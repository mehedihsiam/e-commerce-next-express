"use client";
import React, { useState } from "react";
import Link from "next/link";
import Input from "../ui/Input";
import IconButton from "../ui/IconButton";
import MobileMenu from "./MobileMenu";
import { AuthSidebar, CartSidebar, WishlistSidebar } from "../sidebars";

const Header: React.FC = () => {
  const [isAuthSidebarOpen, setIsAuthSidebarOpen] = useState(false);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const [isWishlistSidebarOpen, setIsWishlistSidebarOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  E-Commerce
                </span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="w-full"
                  iconName="search"
                />
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Wishlist */}
              <IconButton
                alertCount={13}
                iconName="heart"
                onClick={() => setIsWishlistSidebarOpen(true)}
              />

              {/* Cart */}
              <IconButton
                alertCount={3}
                iconName="cart"
                iconClassName="text-xl"
                onClick={() => setIsCartSidebarOpen(true)}
              />

              {/* User Menu */}
              <IconButton
                iconName="user"
                onClick={() => setIsAuthSidebarOpen(true)}
              />
            </div>
          </div>

          {/* Mobile Menu */}
          <MobileMenu />
        </nav>
      </header>

      {/* Sidebars */}
      <AuthSidebar
        isOpen={isAuthSidebarOpen}
        onClose={() => setIsAuthSidebarOpen(false)}
      />
      <CartSidebar
        isOpen={isCartSidebarOpen}
        onClose={() => setIsCartSidebarOpen(false)}
      />
      <WishlistSidebar
        isOpen={isWishlistSidebarOpen}
        onClose={() => setIsWishlistSidebarOpen(false)}
      />
    </>
  );
};

export default Header;
