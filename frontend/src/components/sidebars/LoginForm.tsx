"use client";
import React, { FormEvent } from "react";
import { Button, Input } from "../ui";
import { useFormik } from "formik";
import Spacer from "../ui/Spacer";
import * as Yup from "yup";
import loginUser from "@/utils/api/apiLogin";
import { useAuthStore } from "@/store/authStore";
import showToast from "@/utils/toast";
import { TAuthUIMode } from "@/types/authUiMode";

type TProps = {
  onClose: () => void;
  changeMode: (mode: TAuthUIMode) => void;
  defaultEmail?: string;
};

export default function LoginForm(props: TProps) {
  const { onClose, changeMode, defaultEmail } = props;
  const [loading, setLoading] = React.useState(false);
  const { login } = useAuthStore((state) => state);

  const formik = useFormik({
    initialValues: {
      email: defaultEmail || "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);

      // Call your login API here
      try {
        const response = await loginUser(values);

        // Handle successful login
        login(response.user, response.token);
        showToast.success("Successfully logged in!", {
          description: "Welcome back!",
        });
        onClose();
      } catch (error) {
        showToast.error("Error logging in", {
          description: "Please check your credentials and try again.",
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

      <Input
        type="password"
        name="password"
        placeholder="Password"
        value={formik.values.password}
        onChange={formik.handleChange}
        error={formik.touched.password ? formik.errors.password : undefined}
        required
      />
      <Spacer height="16px" />
      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          className="text-sm hover:bg-transparent hover:text-brand"
          onClick={() => changeMode("forgot-password")}
        >
          Forgot Password?
        </Button>
      </div>
      <Spacer height="16px" />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
