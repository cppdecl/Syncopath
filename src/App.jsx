import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import MainMenu from "./menus/MainMenu.jsx";
import PlayMenu from "./menus/PlayMenu.jsx";
import GameMenu from "./menus/GameMenu.jsx";
import ScoreMenu from "./menus/ScoreMenu.jsx";
import LoginMenu from "./menus/LoginMenu.jsx";
import RegisterMenu from "./menus/RegisterMenu.jsx";
import LeaderboardMenu from "./menus/LeaderboardMenu.jsx";
import { useEffect, useState } from "react";

import { apiGet } from "./api/Client";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      const res = await apiGet("/me");
      console.log("Auth status:", res);

      if (res && !res.error) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        if (!["/login", "/register"].includes(location.pathname)) {
          navigate("/login", { replace: true });
        }
      }
    }
    checkAuth();
  }, [navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/play" element={<PlayMenu />} />
      <Route path="/game" element={<GameMenu />} />
      <Route path="/score" element={<ScoreMenu />} />
      <Route path="/login" element={<LoginMenu />} />
      <Route path="/register" element={<RegisterMenu />} />
      <Route path="/leaderboard" element={<LeaderboardMenu />} />
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
