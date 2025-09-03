import { AuthData } from "@/lib/tokenManager";
import { apiClient } from "./axios";

interface AuthResponse {
  data: AuthData;
  status: number;
}
export const loginWithGoogle = async (token: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post("api/user/google/login/", {
      id_token: token,
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const loginAsAdmin = async (param: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post("api/user/login/", param);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
