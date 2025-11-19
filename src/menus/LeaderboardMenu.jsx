// src/menus/LeaderboardMenu.jsx
import { useEffect, useState } from "react";
import { apiGet } from "../api/Client";
import { Link, useLocation } from "react-router-dom";

export default function LeaderboardMenu() {
  const { state } = useLocation(); // optional: passed beatmap ID
  const beatmapId = state?.beatmapId || null;

  const [globalScores, setGS] = useState([]);
  const [mapScores, setMS] = useState([]);

  useEffect(() => {
    apiGet("/scores/global").then((d) => setGS(d.scores));
    if (beatmapId)
      apiGet(`/scores/beatmap/${beatmapId}`).then((d) => setMS(d.scores));
  }, [beatmapId]);

  return (
    <div className="menu-container">
      <h1>Leaderboards</h1>

      <section>
        <h2>🌍 Global Leaderboard</h2>
        {globalScores.map((s, i) => (
          <p key={i}>
            {i + 1}. {s.username} — {s.score}
          </p>
        ))}
      </section>

      {beatmapId && (
        <section>
          <h2>🎵 Beatmap Leaderboard</h2>
          {mapScores.map((s, i) => (
            <p key={i}>
              {i + 1}. {s.username} — {s.score}
            </p>
          ))}
        </section>
      )}

      <Link className="btn" to="/">
        Back
      </Link>
    </div>
  );
}
