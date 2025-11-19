// src/menus/PlayMenu.jsx

import React from "react";
import { useBeatmapLogic } from "../hooks/useBeatmapLogic";

const PlayMenu = () => {
  const {
    loadedBeatmaps,
    currentBeatmapDisplay,
    isLoading,
    error,
    handleFileChange,
    leaderboard,
    handlePlayBeatmap,
    navigate,
    setSelectedBeatmapForDisplay,
    selectedBeatmapForPlay,
  } = useBeatmapLogic();

  const handleLeaderboardEntryClick = (entry) => {
    sessionStorage.setItem(
      "lastGameScore",
      JSON.stringify({
        score: entry.score,
        accuracy: entry.accuracy,
        maxCombo: entry.combo,
        rank: entry.rank,
        judgements: {
          MARVELOUS: entry.judgements?.MARVELOUS || 0,
          PERFECT: entry.judgements?.PERFECT || 0,
          GREAT: entry.judgements?.GREAT || 0,
          GOOD: entry.judgements?.GOOD || 0,
          BAD: entry.judgements?.BAD || 0,
          MISS: entry.judgements?.MISS || 0,
        },
        beatmapId: currentBeatmapDisplay.id,
      })
    );
    navigate("/score");
  };

  if (!currentBeatmapDisplay) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white">
        <div className="text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-32 h-32 mb-6 relative">
              <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full animate-ping"></div>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-purple-600 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold tracking-wider">
              LOADING BEATMAPS
            </p>
            <div className="mt-4 h-1 w-48 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full animate-pulse"
                style={{ width: "70%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white p-6 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s infinite alternate`,
            }}
          ></div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/80 border-l-4 border-red-500 rounded-r-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-red-100 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mb-4 p-4 bg-blue-900/80 border-l-4 border-purple-400 rounded-r-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3 text-blue-300 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <p className="text-blue-100 font-medium">Processing beatmap...</p>
          </div>
        </div>
      )}

      {/* Top Section - Beatmap Details */}
      <div className="mb-6 relative z-10">
        <div className="flex items-start space-x-6">
          {/* Beatmap Cover Art */}
          <div className="w-46 h-46 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
            {currentBeatmapDisplay.backgroundImage ? (
              <img
                src={currentBeatmapDisplay.backgroundImage}
                alt="Beatmap Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-700 to-purple-800 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300 drop-shadow-lg">
              {currentBeatmapDisplay.title}
            </h1>
            <p className="text-xl text-purple-200 mt-1">
              by {currentBeatmapDisplay.artist}
            </p>
            <p className="text-sm text-purple-300 mt-1">
              Mapped by {currentBeatmapDisplay.mapper}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
              <div className="bg-purple-900/40 p-3 rounded-lg backdrop-blur-sm border border-purple-800/50">
                <p className="text-purple-300 text-xs uppercase tracking-wider">
                  Length
                </p>
                <p className="text-xl font-mono font-bold">
                  {currentBeatmapDisplay.length}
                </p>
              </div>
              <div className="bg-purple-900/40 p-3 rounded-lg backdrop-blur-sm border border-purple-800/50">
                <p className="text-purple-300 text-xs uppercase tracking-wider">
                  BPM
                </p>
                <p className="text-xl font-mono font-bold">
                  {currentBeatmapDisplay.bpm}
                </p>
              </div>
              <div className="bg-purple-900/40 p-3 rounded-lg backdrop-blur-sm border border-purple-800/50">
                <p className="text-purple-300 text-xs uppercase tracking-wider">
                  Objects
                </p>
                <p className="text-xl font-mono font-bold">
                  {currentBeatmapDisplay.objects}
                </p>
              </div>
              <div className="bg-purple-900/40 p-3 rounded-lg backdrop-blur-sm border border-purple-800/50">
                <p className="text-purple-300 text-xs uppercase tracking-wider">
                  Notes/Holds
                </p>
                <p className="text-xl font-mono font-bold">
                  {currentBeatmapDisplay.circles}/
                  {currentBeatmapDisplay.sliders}
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty Badge */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-4 rounded-xl shadow-lg w-46 h-46 items-center justify-center flex flex-col text-center">
              <div className="text-xs text-purple-200 uppercase tracking-wider">
                Difficulty
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {currentBeatmapDisplay.difficulty}
              </div>
              <div className="flex justify-center items-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(currentBeatmapDisplay.stars)
                        ? "text-yellow-400 fill-current"
                        : "text-purple-300"
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-xs text-purple-200 mt-1">
                {currentBeatmapDisplay.stars.toFixed(1)} stars
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
              {currentBeatmapDisplay.keys || 4}K
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-6 overflow-hidden relative z-10">
        {/* Left Side - Leaderboard */}
        <div className="w-1/3 bg-gray-800/80 rounded-xl p-4 overflow-y-auto backdrop-blur-sm border border-purple-900/50 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-purple-300 border-b border-purple-900/50 pb-2 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            LEADERBOARD
          </h2>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                className={`bg-gradient-to-r ${
                  index < 3
                    ? index === 0
                      ? "from-yellow-500/10 to-yellow-600/20 border-yellow-500/30"
                      : index === 1
                      ? "from-gray-600/20 to-gray-700/30 border-gray-500/30"
                      : "from-amber-700/10 to-amber-800/20 border-amber-600/30"
                    : "from-purple-900/10 to-gray-800/20 border-purple-900/30"
                } p-3 rounded-lg border hover:border-purple-400/50 transition-all cursor-pointer group`}
                onClick={() => handleLeaderboardEntryClick(entry)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span
                      className={`font-bold mr-2 ${
                        index === 0
                          ? "text-yellow-400"
                          : index === 1
                          ? "text-gray-300"
                          : index === 2
                          ? "text-amber-400"
                          : "text-purple-300"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="font-medium group-hover:text-purple-200 transition-colors">
                      {entry.player}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-300 font-bold text-lg mr-2">
                      {entry.accuracy.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-2">
                  <span>
                    <span className="text-purple-200 font-mono">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="ml-2 text-purple-300">
                      ({entry.combo}x)
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Beatmap Selection */}
        <div className="w-2/3 bg-gray-800/80 rounded-xl p-4 overflow-y-auto backdrop-blur-sm border border-purple-900/50 shadow-lg">
          {/* Filter Buttons */}
          <div className="flex space-x-2 mb-4">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-all font-medium text-white border border-purple-700 hover:border-purple-600 shadow-md">
              ALL MAPS
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all font-medium text-gray-200 border border-gray-600 hover:border-gray-500">
              RECENTLY PLAYED
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all font-medium text-gray-200 border border-gray-600 hover:border-gray-500">
              BY DIFFICULTY
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all font-medium text-gray-200 border border-gray-600 hover:border-gray-500">
              FAVORITES
            </button>
          </div>

          <div className="space-y-3">
            {/* Upload Section */}
            <div className="p-4 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl border-2 border-dashed border-purple-500 hover:border-purple-400 transition-all group">
              <label
                htmlFor="osz-upload"
                className="block text-center cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-3 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                    <svg
                      className="w-8 h-8 text-purple-300 group-hover:text-purple-200 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-purple-200 group-hover:text-white transition-colors">
                    UPLOAD .OSZ BEATMAP
                  </span>
                  <p className="text-xs text-purple-300 mt-1 group-hover:text-purple-200 transition-colors">
                    Drag & drop or click to browse files
                  </p>
                </div>
                <input
                  type="file"
                  id="osz-upload"
                  accept=".osz"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Beatmap List */}
            {loadedBeatmaps.length === 0 ? (
              <div className="p-8 bg-gray-800/50 rounded-xl text-center border border-purple-900/50">
                <div className="text-5xl mb-4 text-purple-400">♪</div>
                <p className="text-xl text-purple-200 mb-2">
                  NO BEATMAPS LOADED
                </p>
                <p className="text-sm text-purple-300">
                  Upload a .osz file to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-purple-900/50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-sm text-purple-200 font-medium">
                    {loadedBeatmaps.length} BEATMAP
                    {loadedBeatmaps.length !== 1 ? "S" : ""} LOADED
                  </p>
                </div>

                {loadedBeatmaps.map((beatmap, index) => (
                  <div
                    key={index}
                    className={`p-3 bg-gray-800/50 hover:bg-gray-700/60 rounded-lg cursor-pointer transition-all ${
                      selectedBeatmapForPlay &&
                      selectedBeatmapForPlay.metadata.title ===
                        beatmap.metadata.title &&
                      selectedBeatmapForPlay.metadata.difficulty ===
                        beatmap.metadata.difficulty
                        ? "ring-2 ring-yellow-400/50"
                        : "border border-gray-700/50 hover:border-purple-500/50"
                    } shadow-md hover:shadow-purple-900/30 flex items-center space-x-3 group`}
                    onClick={() => setSelectedBeatmapForDisplay(beatmap)}
                  >
                    {/* Beatmap Image */}
                    <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gradient-to-br from-purple-900/70 to-indigo-900/70 flex items-center justify-center relative">
                      {beatmap.backgroundImage ? (
                        <img
                          src={beatmap.backgroundImage}
                          alt="Beatmap Background"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-indigo-900/30"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <svg
                              className="w-6 h-6 text-purple-300 mb-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                              />
                            </svg>
                            <span className="text-xs text-purple-200 font-medium">
                              {beatmap.metadata.keys || 4}K
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate group-hover:text-purple-200 transition-colors">
                        {beatmap.metadata.title || "Unknown Title"}
                      </h3>
                      <p className="text-purple-200 text-sm truncate">
                        {beatmap.metadata.artist || "Unknown Artist"}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs px-2 py-0.5 bg-purple-900/50 rounded-full text-purple-200">
                          {beatmap.metadata.difficulty || "Unknown"}
                        </span>
                        <span className="text-xs text-purple-300 truncate">
                          {beatmap.metadata.mapper || "Unknown Mapper"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center">
                        <span className="text-yellow-300 font-bold text-lg mr-1">
                          {beatmap.metadata.stars?.toFixed(1) || "0.0"}
                        </span>
                        <svg
                          className="w-4 h-4 text-yellow-300"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="text-xs text-purple-300 mt-1 whitespace-nowrap">
                        {beatmap.metadata.bpm || 0} BPM
                      </div>
                      <div className="text-xs text-purple-300 whitespace-nowrap">
                        {beatmap.metadata.length || "0:00"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex justify-between items-center mt-6 relative z-10">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all border border-gray-600 hover:border-gray-500 flex items-center group shadow-md"
        >
          <svg
            className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          MENU
        </button>

        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg font-medium transition-all border border-purple-700 hover:border-purple-600 flex items-center shadow-lg hover:shadow-purple-900/30"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            REFRESH
          </button>

          <button
            onClick={() =>
              selectedBeatmapForPlay &&
              handlePlayBeatmap(selectedBeatmapForPlay)
            }
            disabled={!selectedBeatmapForPlay || isLoading}
            className="px-8 py-2 bg-gradient-to-r from-purple-700 to-purple-500 hover:from-pink-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-lg font-medium transition-all border border-purple-700 hover:border-purple-600 disabled:border-gray-600 flex items-center shadow-lg hover:shadow-cyan-900/30"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            PLAY
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayMenu;
