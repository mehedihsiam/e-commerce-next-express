"use client";
import React, { FormEvent } from "react";
import { Button, Input } from "../ui";
import { useFormik } from "formik";
import Spacer from "../ui/Spacer";
import * as Yup from "yup";
import showToast from "@/utils/toast";
import { TAuthUIMode } from "@/types/authUiMode";
import apiChangePassword from "@/utils/api/apiChangePassword";

type TProps = {
  changeMode: (mode: TAuthUIMode) => void;
};

export default function ResetPasswordForm(props: TProps) {
  const { changeMode } = props;
  const [loading, setLoading] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
    validationSchema: Yup.object({
      newPassword: Yup.string().required("Required"),
      confirmNewPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);

      // Call your login API here
      try {
        await apiChangePassword({
          newPassword: values.newPassword,
        });

        showToast.success("Password changed successfully!", {
          description: "Your password has been updated.",
        });
        changeMode("login");
      } catch (error) {
        showToast.error("Error changing password", {
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
        type="password"
        name="newPassword"
        placeholder="New Password"
        value={formik.values.newPassword}
        onChange={formik.handleChange}
        error={
          formik.touched.newPassword ? formik.errors.newPassword : undefined
        }
      />
      <Spacer height="16px" />

      <Input
        type="password"
        name="confirmNewPassword"
        placeholder="Confirm New Password"
        value={formik.values.confirmNewPassword}
        onChange={formik.handleChange}
        error={
          formik.touched.confirmNewPassword
            ? formik.errors.confirmNewPassword
            : undefined
        }
        required
      />

      <Spacer height="16px" />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Changing Password..." : "Change Password"}
      </Button>
    </form>
  );
}
