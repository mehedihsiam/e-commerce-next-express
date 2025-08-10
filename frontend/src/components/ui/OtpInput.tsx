"use client";

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  length: number;
  value: string[];
  onChange: (value: string[]) => void;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  inputClassName?: string;
}

const OtpInput: React.FC<OtpInputProps> = ({
  length,
  value,
  onChange,
  activeIndex,
  onActiveIndexChange,
  disabled = false,
  error = false,
  className = "",
  inputClassName = "",
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Focus management
  useEffect(() => {
    if (inputRefs.current[activeIndex]) {
      inputRefs.current[activeIndex]?.focus();
    }
  }, [activeIndex]);

  const handleChange = (inputValue: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(inputValue)) return;

    const newValue = [...value];

    // Handle pasted content
    if (inputValue.length > 1) {
      const pastedOtp = inputValue.slice(0, length).split("");
      pastedOtp.forEach((digit, i) => {
        if (index + i < length) {
          newValue[index + i] = digit;
        }
      });
      onChange(newValue);

      // Focus the next empty input or the last input
      const nextIndex = Math.min(index + pastedOtp.length, length - 1);
      onActiveIndexChange(nextIndex);
      return;
    }

    // Handle single character input
    newValue[index] = inputValue;
    onChange(newValue);

    // Move to next input if current is filled
    if (inputValue && index < length - 1) {
      onActiveIndexChange(index + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      const newValue = [...value];

      if (value[index]) {
        // Clear current input
        newValue[index] = "";
        onChange(newValue);
      } else if (index > 0) {
        // Move to previous input and clear it
        newValue[index - 1] = "";
        onChange(newValue);
        onActiveIndexChange(index - 1);
      }
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      onActiveIndexChange(index - 1);
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      onActiveIndexChange(index + 1);
    }

    // Handle Enter key
    if (e.key === "Enter") {
      e.preventDefault();
      // Let parent handle Enter key event
      const event = new CustomEvent("otpEnter", {
        detail: {
          otp: value.join(""),
          isComplete: value.join("").length === length,
        },
      });
      document.dispatchEvent(event);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const pastedOtp = pastedData.replace(/\D/g, "").slice(0, length);

    if (pastedOtp) {
      const newValue = pastedOtp
        .split("")
        .concat(new Array(length).fill(""))
        .slice(0, length);
      onChange(newValue);

      // Focus the last filled input
      const lastFilledIndex = Math.min(pastedOtp.length - 1, length - 1);
      onActiveIndexChange(lastFilledIndex);
    }
  };

  const handleFocus = (index: number) => {
    onActiveIndexChange(index);
  };

  return (
    <div className={`flex gap-3 justify-center ${className}`}>
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={length}
          value={digit}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={`
            w-12 h-12 text-center text-xl font-bold border-2 rounded-lg
            transition-all duration-200 outline-none
            ${
              digit
                ? "border-brand bg-blue-50 text-brand-darker"
                : activeIndex === index
                ? "border-brand bg-brand/10 shadow-sm"
                : "border-gray-300 bg-white"
            }
            ${error ? "border-red-400 bg-red-50" : ""}
            ${
              disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "hover:border-brand-darker focus:border-brand focus:ring-2 focus:ring-brand-light"
            }
            ${inputClassName}
          `}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
