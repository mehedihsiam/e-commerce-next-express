import API_ROUTES from "@/constants/API_ROUTES";
import axiosInstance from "./base/axiosInstance";
import Cookies from "js-cookie";
import { IUser } from "@/types/auth";

type TReqData = {
  email: string;
  password: string;
  name: string;
};

type TResData = {
  user: IUser;
  token: string;
  message: string;
};

const apiSignup = async (data: TReqData) => {
  const instance = axiosInstance(false);

  try {
    const response = await instance.post(API_ROUTES.REGISTER, data);
    Cookies.set("token", response.data.token, {
      expires: 1,
      secure: true,
      sameSite: "strict",
      httpOnly: true,
    });
    return response.data as TResData;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export default apiSignup;
