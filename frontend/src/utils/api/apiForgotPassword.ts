import API_ROUTES from "@/constants/API_ROUTES";
import axiosInstance from "./base/axiosInstance";

type TReqData = {
  email: string;
};

type TResData = {
  message: string;
};

const apiForgotPassword = async (data: TReqData) => {
  const instance = axiosInstance(false);

  try {
    const response = await instance.post(API_ROUTES.FORGOT_PASSWORD, data);
    return response.data as TResData;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export default apiForgotPassword;
