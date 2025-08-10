import API_ROUTES from "@/constants/API_ROUTES";
import axiosInstance from "./base/axiosInstance";
import Cookies from "js-cookie";

type TReqData = {
  email: string;
  otp: string;
};

type TResData = {
  message: string;
};

const apiVerifyOtp = async (data: TReqData) => {
  const instance = axiosInstance(false);

  try {
    const response = await instance.post(API_ROUTES.VERIFY_OTP, data);
    Cookies.set("token", response.data.token, {
      expires: 1,
      secure: true,
      sameSite: "strict",
    });
    return response.data as TResData;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

export default apiVerifyOtp;
