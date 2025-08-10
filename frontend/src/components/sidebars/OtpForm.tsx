"use client";

import { useState, useEffect } from "react";
import Button from "../ui/Button";
import OtpInput from "../ui/OtpInput";
import apiVerifyOtp from "@/utils/api/apiVerifyOtp";
import showToast from "@/utils/toast";
import { TAuthUIMode } from "@/types/authUiMode";

type TProps = {
  email: string;
  changeMode: (mode: TAuthUIMode) => void;
};

const OtpForm = (props: TProps) => {
  const { email, changeMode } = props;
  const length = 6;
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer for resend cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (otpString?: string) => {
    const finalOtp = otpString || otp.join("");
    if (finalOtp.length !== length) return;

    setIsSubmitting(true);
    try {
      await apiVerifyOtp({ email, otp: finalOtp });
      showToast.success("OTP verified successfully!");
      changeMode("reset-password");
    } catch (error) {
      console.error("OTP submission error:", error);
      showToast.error("Failed to verify OTP.");
      setError("Invalid OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setResendTimer(60);
    try {
      // await onResend();
    } catch (error) {
      console.error("Resend error:", error);
      setResendTimer(0); // Reset timer on error
    }
  };

  const isComplete = otp.join("").length === length;
  const isLoading = isSubmitting;

  return (
    <div className={`w-full max-w-md mx-auto `}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h2>
      </div>

      {/* OTP Input */}
      <div className="mb-6">
        <div className="mb-4">
          <OtpInput
            length={length}
            value={otp}
            onChange={setOtp}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            disabled={isLoading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-sm text-center mb-4 flex items-center justify-center gap-1">
            <span className="text-red-500">⚠</span>
            {error}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Submit Button (if not auto-submit) */}

        <Button
          variant="brand"
          onClick={() => handleSubmit()}
          disabled={!isComplete || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </div>
          ) : (
            "Verify Code"
          )}
        </Button>
      </div>

      {/* Resend Section */}

      <div className="mt-6 text-center">
        {resendTimer > 0 ? (
          <p className="text-gray-500 text-sm">Resend in {resendTimer}s</p>
        ) : (
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={isLoading}
            className="text-url hover:text-brand-darker font-medium text-sm transition-colors duration-200 disabled:text-gray-400 hover:bg-transparent"
          >
            Resend Code
          </Button>
        )}
      </div>
    </div>
  );
};

export default OtpForm;
