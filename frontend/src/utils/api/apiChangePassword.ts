import API_ROUTES from "@/constants/API_ROUTES";
import axiosInstance from "./base/axiosInstance";
import Cookies from "js-cookie";

type TReqData = {
  newPassword: string;
};

type TResData = {
  message: string;
};

const apiChangePassword = async (data: TReqData) => {
  const instance = axiosInstance(true);

  try {
    const response = await instance.put(API_ROUTES.CHANGE_PASSWORD, data);
    return response.data as TResData;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

export default apiChangePassword;
