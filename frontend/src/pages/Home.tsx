import HeroSection from "@/components/HeroSection";
import StarParticlesComponent from "@/components/StarParticlesComponent";
import { ROUTES } from "@/lib/routes";
import tokenManager from "@/lib/tokenManager";
import { useEffect } from "react";
import { LazyLoadComponent } from "react-lazy-load-image-component";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (tokenManager.isAuthenticated()) {
      const user = tokenManager.getUser();
      if (user) {
        if (user.role === "student") {
          navigate(ROUTES.CHAT);
        } else if (user.role === "admin") {
          navigate(ROUTES.ADMIN);
        }
      }
    }
  }, [navigate]);

  return (
    <LazyLoadComponent threshold={100}>
      <StarParticlesComponent />
      <HeroSection />
    </LazyLoadComponent>
  );
};

export default Home;
