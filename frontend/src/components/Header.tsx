import { ROUTES } from "@/lib/routes";
import tokenManager from "@/lib/tokenManager";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const isAuthenticated = tokenManager.isAuthenticated();
  const user = tokenManager.getUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="flex flex-col w-full relative">
      {/* Top bar */}
      <div className="flex justify-between items-center w-full px-4 py-3">
        <div className="logo text-lg font-bold">AskUoK</div>

        {/* Hamburger — mobile only */}
        {pathname !== "/" && <button
          className="md:hidden fill-white text-white p-2 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition relative"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen
            ? <X size={20} style={{ width: "20px", height: "20px", position:'absolute', top:0, left:0 }} />
            : <Menu size={20} style={{ width: "20px", height: "20px", position:'absolute', top:0, left:0 }} />}
        </button>}

        {/* Desktop nav */}
        <div className="hidden md:flex gap-4 items-center">
          <NavContent
            isAuthenticated={isAuthenticated}
            user={user}
            onAction={() => {}}
          />
        </div>
      </div>

      {/* Mobile dropdown — absolute so it doesn't push content down */}
      <div
        className={`
          md:hidden absolute top-full left-0 right-0 z-50
          bg-gray-900 border-t border-gray-700 shadow-lg
          transition-all duration-300 ease-in-out overflow-hidden
          ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
        `}
      >
        <div className="flex flex-col gap-3 px-4 py-4">
          <NavContent
            isAuthenticated={isAuthenticated}
            user={user}
            onAction={() => setMenuOpen(false)}
            vertical
          />
        </div>
      </div>
    </header>
  );
}

function NavContent({
  isAuthenticated,
  user,
  onAction,
  vertical = false,
}: {
  isAuthenticated: boolean;
  user: any;
  onAction: () => void;
  vertical?: boolean;
}) {
  const layout = vertical ? "flex flex-col gap-3" : "flex gap-4 items-center";

  return (
    <div className={layout}>
      {isAuthenticated && user && (
        <>
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <span className="text-sm text-gray-300">
              Welcome, {user.username || user.email.split("@")[0]}
            </span>
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
              {user.role}
            </span>
          </div>

          {(user.role === "student" || user.role === "admin") && (
            <Link to={ROUTES.CHAT} onClick={onAction}>
              <Button variant="outline" size="sm" className="w-full md:w-auto">
                Chat
              </Button>
            </Link>
          )}

          {user.role === "admin" && (
            <Link to={ROUTES.ADMIN} onClick={onAction}>
              <Button variant="outline" size="sm" className="w-full md:w-auto">
                Admin Panel
              </Button>
            </Link>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="w-full md:w-auto"
            onClick={() => {
              tokenManager.logout();
              onAction();
            }}
          >
            Logout
          </Button>
        </>
      )}

      {!isAuthenticated && (
        <>
          {/* <Link to={ROUTES.LOGIN} onClick={onAction}>
            <Button variant="primary" className="w-full md:w-auto">
              Login
            </Button>
          </Link> */}
          {/* <div className="cta flex justify-center md:justify-start">
            <GoogleLogin
              theme="filled_black"
              shape="circle"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
              text="continue_with"
            />
          </div> */}
        </>
      )}
    </div>
  );
}