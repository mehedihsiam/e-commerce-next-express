import React from "react";
import { Input } from "../ui";

export default function MobileMenu() {
  return (
    <div className="md:hidden border-t border-gray-200 py-4">
      <div className="flex flex-col space-y-4">
        {/* Mobile Search */}
        <Input type="text" placeholder="Search products..." iconName="search" />
      </div>
    </div>
  );
}
