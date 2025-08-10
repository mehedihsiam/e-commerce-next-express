"use client";
import React, { FormEvent } from "react";
import { Button, Input } from "../ui";
import { useFormik } from "formik";
import Spacer from "../ui/Spacer";
import * as Yup from "yup";
import showToast from "@/utils/toast";
import { TAuthUIMode } from "@/types/authUiMode";
import apiForgotPassword from "@/utils/api/apiForgotPassword";
import { TSetState } from "@/types/types";

type TProps = {
  changeMode: (mode: TAuthUIMode) => void;
  setForgotPasswordEmail: TSetState<string>;
};

export default function ForgotPasswordForm(props: TProps) {
  const { changeMode, setForgotPasswordEmail } = props;
  const [loading, setLoading] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);

      // Call your login API here
      try {
        await apiForgotPassword(values);

        showToast.success("Successfully sent OTP!", {
          description: "Please check your email for the OTP.",
        });
        setForgotPasswordEmail(values.email);
        changeMode("otp");
      } catch (error) {
        showToast.error("Error sending OTP", {
          description: "Please check your email and try again.",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    formik.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Spacer height="16px" />
      <Input
        type="email"
        name="email"
        placeholder="Email Address"
        value={formik.values.email}
        onChange={formik.handleChange}
        error={formik.touched.email ? formik.errors.email : undefined}
        required
      />
      <Spacer height="16px" />

      <Spacer height="16px" />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Send OTP"}
      </Button>
    </form>
  );
}
