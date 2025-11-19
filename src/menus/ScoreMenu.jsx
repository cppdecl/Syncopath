// src/menus/ScoreMenu.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGlobalCurrentBeatmap } from "../hooks/useBeatmapLogic";
import { apiPost } from "../api/Client";

const ScoreMenu = () => {
  const navigate = useNavigate();
  const [scoreData, setScoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [beatmapInfo, setBeatmapInfo] = useState(null);

  useEffect(() => {
    // Retrieve score data from session storage
    const storedScore = sessionStorage.getItem("lastGameScore");
    const currentBeatmap = getGlobalCurrentBeatmap();

    // inside effect:
    apiPost("/scores/submit", {
      beatmapId: scoreInfo.beatmapId,
      score: scoreInfo.score,
      accuracy: scoreInfo.accuracy,
    });

    if (storedScore) {
      try {
        const parsedScore = JSON.parse(storedScore);
        setScoreData(parsedScore);

        if (currentBeatmap) {
          setBeatmapInfo({
            title: currentBeatmap.metadata.title,
            artist: currentBeatmap.metadata.artist,
            mapper: currentBeatmap.metadata.mapper,
            difficulty: currentBeatmap.metadata.difficulty,
            stars: currentBeatmap.metadata.stars || 0,
          });
        }

        setIsLoading(false);
      } catch (e) {
        console.error("Failed to parse score data from session storage", e);
        setScoreData(null);
        setIsLoading(false);
        sessionStorage.removeItem("lastGameScore"); // Clear corrupted data
      }
    } else {
      console.warn("No score data found in session storage.");
      setScoreData(null);
      setIsLoading(false);
      // If no score data, navigate back to beatmaps
      navigate("/play");
    }
  }, [navigate]);

  const handleBackToBeatmaps = () => {
    sessionStorage.removeItem("lastGameScore"); // Clear on explicit navigation
    navigate("/play");
  };

  const handleRetryGame = () => {
    sessionStorage.removeItem("lastGameScore"); // Clear on explicit navigation
    navigate("/game");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-2xl animate-pulse">
          Loading Your Performance...
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No score data available</p>
          <button
            onClick={handleBackToBeatmaps}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Back to Beatmaps
          </button>
        </div>
      </div>
    );
  }

  const {
    score,
    accuracy,
    maxCombo,
    judgements: { MARVELOUS, PERFECT, GREAT, GOOD, BAD, MISS },
  } = scoreData;

  const getRank = (acc) => {
    if (acc === 100) return "SS";
    if (acc >= 95) return "S";
    if (acc >= 90) return "A";
    if (acc >= 85) return "B";
    if (acc >= 80) return "C";
    if (acc >= 70) return "D";
    return "E";
  };

  const rank = getRank(accuracy);
  const rankColor = {
    SS: "text-purple-400",
    S: "text-yellow-400",
    A: "text-emerald-400",
    B: "text-blue-400",
    C: "text-indigo-400",
    D: "text-orange-400",
    E: "text-red-400",
  }[rank];

  // Calculate hit/miss ratio
  const totalHits = MARVELOUS + PERFECT + GREAT + GOOD + BAD;
  const totalNotes = totalHits + MISS;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white bg-opacity-5"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-purple-500 border-opacity-30 text-center max-w-2xl w-full z-10 transform transition-all duration-500 hover:border-opacity-50 hover:shadow-purple-500/30">
        {/* Beatmap info section */}
        {beatmapInfo && (
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-1">
              {beatmapInfo.title}
            </h2>
            <p className="text-lg text-gray-300 mb-2">{beatmapInfo.artist}</p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="bg-gray-700 px-3 py-1 rounded-full">
                Mapped by {beatmapInfo.mapper}
              </span>
              <span className="bg-purple-600 px-3 py-1 rounded-full">
                {beatmapInfo.difficulty}
              </span>
              <span className="bg-yellow-600 px-3 py-1 rounded-full">
                {beatmapInfo.stars.toFixed(1)}★
              </span>
            </div>
          </div>
        )}

        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-8 animate-fade-in">
          PERFORMANCE RESULTS
        </h1>

        {/* Score display */}
        <div className="mb-10 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg blur opacity-75"></div>
          <div className="relative bg-gray-800 rounded-lg p-6">
            <p className="text-2xl text-gray-300 mb-2">Total Score</p>
            <p className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 animate-pop-in">
              {Math.floor(score).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <div className="relative bg-gray-800 rounded-lg p-6">
              <p className="text-xl text-gray-300 mb-1">Accuracy</p>
              <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                {accuracy.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <div className="relative bg-gray-800 rounded-lg p-6">
              <p className="text-xl text-gray-300 mb-1">Highest Combo</p>
              <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {maxCombo}x
              </p>
            </div>
          </div>
        </div>

        {/* Rank display */}
        <div className="mb-10">
          <p className="text-2xl text-gray-300 mb-4">Rank Achievement</p>
          <div className="relative inline-block">
            <div
              className={`absolute inset-0 bg-${rank.toLowerCase()}-500 rounded-full blur-lg opacity-30`}
            ></div>
            <p
              className={`relative text-9xl font-black animate-bounce-in ${rankColor} drop-shadow-lg`}
            >
              {rank}
            </p>
          </div>
        </div>

        {/* Judgement breakdown */}
        <div className="mb-10">
          <p className="text-2xl text-gray-300 mb-4">Judgement Breakdown</p>
          <div className="grid grid-cols-6 gap-3">
            {[
              {
                name: "MARVELOUS",
                value: MARVELOUS,
                color: "from-purple-400 to-pink-400",
                bgColor: "bg-gradient-to-r from-purple-600 to-pink-600",
              },
              {
                name: "PERFECT",
                value: PERFECT,
                color: "from-yellow-400 to-amber-400",
                bgColor: "bg-gradient-to-r from-yellow-600 to-amber-600",
              },
              {
                name: "GREAT",
                value: GREAT,
                color: "from-emerald-400 to-teal-400",
                bgColor: "bg-gradient-to-r from-emerald-600 to-teal-600",
              },
              {
                name: "GOOD",
                value: GOOD,
                color: "from-blue-400 to-cyan-400",
                bgColor: "bg-gradient-to-r from-blue-600 to-cyan-600",
              },
              {
                name: "BAD",
                value: BAD,
                color: "from-orange-400 to-red-400",
                bgColor: "bg-gradient-to-r from-orange-600 to-red-600",
              },
              {
                name: "MISS",
                value: MISS,
                color: "from-gray-400 to-gray-600",
                bgColor: "bg-gradient-to-r from-gray-600 to-gray-800",
              },
            ].map((judge, index) => (
              <div key={index} className="relative group">
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${judge.color} rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-200`}
                ></div>
                <div className="relative bg-gray-800 rounded-lg p-3">
                  <p
                    className={`text-sm font-semibold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${judge.color}`}
                  >
                    {judge.name}
                  </p>
                  <p className="text-xl font-medium">{judge.value}</p>
                  {totalNotes > 0 && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${judge.bgColor}`}
                        style={{
                          width: `${(judge.value / totalNotes) * 100}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetryGame}
            className="relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-xl font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg group"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-lg transition duration-300"></div>
            RETRY
          </button>
          <button
            onClick={handleBackToBeatmaps}
            className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white text-xl font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg group"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-lg transition duration-300"></div>
            BACK TO BEATMAPS
          </button>
        </div>
      </div>

      {/* Tailwind CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes popIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          80% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes bounceIn {
          0% {
            transform: scale(0.1) rotate(-30deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.2) rotate(10deg);
            opacity: 1;
          }
          80% {
            transform: scale(0.95) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
          100% {
            transform: translateY(0) rotate(360deg);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-pop-in {
          animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          animation-delay: 0.3s;
        }
        .animate-bounce-in {
          animation: bounceIn 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default ScoreMenu;
