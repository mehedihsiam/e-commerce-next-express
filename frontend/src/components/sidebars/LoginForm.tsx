"use client";
import React, { FormEvent } from "react";
import { Button, Input } from "../ui";
import { useFormik } from "formik";
import Spacer from "../ui/Spacer";
import * as Yup from "yup";
import loginUser from "@/utils/api/apiLogin";

export default function LoginForm() {
  const [loading, setLoading] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);

      // Call your login API here
      const response = await loginUser(values);
      if (response) {
        // Handle successful login
        console.log(response);
      }

      setLoading(false);
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
      <Button type="button" variant="ghost" className="w-full text-sm">
        Forgot Password?
      </Button>
      <Spacer height="16px" />

      <Button type="submit" className="w-full">
        {loading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
