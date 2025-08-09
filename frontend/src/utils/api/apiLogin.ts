import API_ROUTES from "@/constants/API_ROUTES";
import axiosInstance from "./base/axiosInstance";
import Cookies from "js-cookie";

type TReqData = {
  email: string;
  password: string;
};

const loginUser = async (data: TReqData) => {
  const instance = axiosInstance(true);

  try {
    const response = await instance.post(API_ROUTES.LOGIN, data);
    Cookies.set("token", response.data.token, {
      expires: 1,
      secure: true,
      sameSite: "strict",
    });
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export default loginUser;
