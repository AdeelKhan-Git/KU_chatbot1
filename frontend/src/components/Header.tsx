import { handleGoogleFailure, handleGoogleSuccess } from "@/hooks/useLogin";
import { ROUTES } from "@/lib/routes";
import tokenManager from "@/lib/tokenManager";
import { GoogleLogin } from "@react-oauth/google";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export default function Header() {
  const isAuthenticated = tokenManager.isAuthenticated();
  const user = tokenManager.getUser();

  return (
    <header className="flex justify-between items-center">
      <div className="logo">AskUoK</div>
      <div className="flex gap-4 items-center">
        {isAuthenticated && user && (
          <>
            <span className="text-sm text-gray-300">
              Welcome, {user.username || user.email.split("@")[0]}
            </span>
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
              {user.role}
            </span>
            {user.role === "student" && (
              <Link to={ROUTES.CHAT}>
                <Button variant="outline" size="sm">
                  Chat
                </Button>
              </Link>
            )}
            {user.role === "admin" && (
              <>
                <Link to={ROUTES.CHAT}>
                  <Button variant="outline" size="sm">
                    Chat
                  </Button>
                </Link>
                <Link to={ROUTES.ADMIN}>
                  <Button variant="outline" size="sm">
                    Admin Panel
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => tokenManager.logout()}
            >
              Logout
            </Button>
          </>
        )}

        {!isAuthenticated && (
          <>
            <Link to={ROUTES.LOGIN}>
              <Button variant="primary">Login</Button>
            </Link>
            <div className="cta">
              <GoogleLogin
                theme="filled_black"
                shape="circle"
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                text="continue_with"
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
