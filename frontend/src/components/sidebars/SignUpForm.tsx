import React from "react";
import { Button, Input } from "../ui";
import { useFormik } from "formik";
import * as Yup from "yup";
import Spacer from "../ui/Spacer";
import apiSignup from "@/utils/api/apiSignup";

export default function SignUpForm() {
  const [loading, setLoading] = React.useState(false);
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Required"),
      firstName: Yup.string().required("Required"),
      lastName: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      // Handle form submission
      setLoading(true);
      try {
        await apiSignup({
          email: values.email,
          password: values.password,
          name: `${values.firstName} ${values.lastName}`,
        });
        // Handle successful signup (e.g., show a success message, redirect, etc.)
      } catch (error) {
        console.error("Error signing up:", error);
        // Handle error (e.g., show an error message)
      } finally {
        setLoading(false);
      }
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    formik.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formik.values.firstName}
            onChange={formik.handleChange}
            error={
              formik.touched.firstName ? formik.errors.firstName : undefined
            }
            required
          />
          <Input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            error={formik.touched.lastName ? formik.errors.lastName : undefined}
            required
          />
        </div>
        <Spacer height="16px" />
        <Input
          type="email"
          name="email"
          placeholder="Email"
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
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          error={
            formik.touched.confirmPassword
              ? formik.errors.confirmPassword
              : undefined
          }
          required
        />

        <Spacer height="16px" />
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </Button>
      </>
    </form>
  );
}
