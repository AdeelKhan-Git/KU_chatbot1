import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Loader from "./components/Loader";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { ROUTES } from "./lib/routes";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Chat = lazy(() => import("./pages/Chat"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen min-w-screen flex items-center justify-center">
          <Loader />
        </div>
      }
    >
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route
          path={ROUTES.CHAT}
          element={
            <RoleProtectedRoute allowedRoles={["student", "admin"]}>
              <Chat />
            </RoleProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN}
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </RoleProtectedRoute>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  );
}

export default App;
