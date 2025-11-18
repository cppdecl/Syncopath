import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainMenu from "./menus/MainMenu.jsx";
import PlayMenu from "./menus/PlayMenu.jsx";
import GameMenu from "./menus/GameMenu.jsx";
import ScoreMenu from "./menus/ScoreMenu.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/play" element={<PlayMenu />} />
        <Route path="/game" element={<GameMenu />} />
        <Route path="/score" element={<ScoreMenu />} />
      </Routes>
    </Router>
  );
}

export default App;
