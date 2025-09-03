import { loginAsAdmin, loginWithGoogle } from "@/api/auth";
import { ROUTES } from "@/lib/routes";
import tokenManager from "@/lib/tokenManager";
import toast from "react-hot-toast";

export const handleGoogleSuccess = async (credentialResponse: any) => {
  try {
    const idToken = credentialResponse.credential;

    const response = await loginWithGoogle(idToken);
    tokenManager.setAuthData(response.data);
    const user = response.data.user;
    if (user.role === "student") {
      window.location.href = ROUTES.CHAT;
    } else if (user.role === "admin") {
      window.location.href = ROUTES.ADMIN;
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.error || "Google login failed. Try again."
    );
  }
};

export const handleGoogleFailure = () => {
  toast.error("Google sign-in failed");
};

export const useLogin = async (param: { email: string; password: string }) => {
  try {
    const response = await loginAsAdmin(param);
    tokenManager.setAuthData(response.data);
    window.location.href = ROUTES.ADMIN;

    toast.success("Admin login successful!");
  } catch (error: any) {
    console.error("Admin login error:", error);
    toast.error(
      error.response?.data?.error || "Admin sign-in failed. Please try again."
    );
  }
};
