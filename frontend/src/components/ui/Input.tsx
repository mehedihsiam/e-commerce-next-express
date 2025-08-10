"use client";
import React from "react";
import VectorIcon, { TIconName } from "../VectorIcon";
import cn from "../../utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconName?: TIconName;
  iconClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  iconName,
  iconClassName,
  className = "",
  type,
  ...props
}) => {
  const [isSecured, setIsSecured] = React.useState(true);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {iconName && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <VectorIcon
              name={iconName}
              className={cn(["text-current", iconClassName])}
            />
          </div>
        )}
        <input
          type={type === "password" ? (isSecured ? "password" : "text") : type}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent
            ${iconName ? "pl-10" : ""}
            ${type === "password" ? "pr-10" : ""}
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : ""
            }
            ${className}
          `}
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
            onClick={() => setIsSecured((prev) => !prev)}
          >
            <VectorIcon
              name={isSecured ? "eye" : "eye-off"}
              className="text-gray-400 hover:text-gray-600"
            />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
