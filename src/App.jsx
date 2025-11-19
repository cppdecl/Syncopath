import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainMenu from "./menus/MainMenu.jsx";
import PlayMenu from "./menus/PlayMenu.jsx";
import GameMenu from "./menus/GameMenu.jsx";
import ScoreMenu from "./menus/ScoreMenu.jsx";
import LeaderboardMenu from "./menus/LeaderboardMenu.jsx";
import { useEffect, useState } from "react";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/play" element={<PlayMenu />} />
      <Route path="/game" element={<GameMenu />} />
      <Route path="/score" element={<ScoreMenu />} />
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
