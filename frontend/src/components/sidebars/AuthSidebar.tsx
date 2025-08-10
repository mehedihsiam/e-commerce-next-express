"use client";
import React, { useState } from "react";
import Sidebar from "../ui/Sidebar";
import Button from "../ui/Button";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import { TAuthUIMode } from "@/types/authUiMode";
import ForgotPasswordForm from "./ForgotPasswordForm";
import VectorIcon from "../VectorIcon";
import { OtpForm } from "../ui";
import ResetPasswordForm from "./ResetPasswordForm";

interface AuthSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthSidebar: React.FC<AuthSidebarProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<TAuthUIMode>("login");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("");

  const changeFormMode = (mode: TAuthUIMode) => {
    setMode(mode);
  };

  const getForm = () => {
    switch (mode) {
      case "login":
        return <LoginForm onClose={onClose} changeMode={changeFormMode} />;
      case "signup":
        return <SignUpForm onClose={onClose} />;
      case "forgot-password":
        return (
          <ForgotPasswordForm
            setForgotPasswordEmail={setForgotPasswordEmail}
            changeMode={changeFormMode}
          />
        );

      case "otp":
        return (
          <OtpForm email={forgotPasswordEmail} changeMode={changeFormMode} />
        );

      case "reset-password":
        return <ResetPasswordForm changeMode={changeFormMode} />;
      default:
        return null;
    }
  };

  const getIconName = () => {
    switch (mode) {
      case "login":
        return "user";
      case "signup":
        return "user";
      case "forgot-password":
        return "password";
      case "otp":
        return "password";
      case "reset-password":
        return "password";
      default:
        return "user";
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login":
        return "Sign In";
      case "signup":
        return "Create Account";
      case "forgot-password":
        return "Forgot Password";
      case "otp":
        return "Verify OTP";
      case "reset-password":
        return "Reset Password";
      default:
        return "Sign In";
    }
  };

  return (
    <Sidebar isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="p-6">
        <div className="flex flex-col items-center mb-5">
          <VectorIcon name={getIconName()} className="text-[5rem]" />
        </div>

        {getForm()}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>
          <Button
            variant="outline-brand"
            onClick={() =>
              changeFormMode(mode === "login" ? "signup" : "login")
            }
            className="w-full mt-2"
          >
            {mode === "login" ? "Create Account" : "Sign In"}
          </Button>
        </div>
      </div>
    </Sidebar>
  );
};

export default AuthSidebar;
