// hooks/useBeatmapLogic.js
import { useState, useEffect, useCallback } from "react";
import {
  parseOszFile,
  createBlobUrl, // Changed import name
  // eslint-disable-next-line no-unused-vars
  base64ToArrayBuffer, // Keep this if needed elsewhere, but not directly used for Blob URL creation from base64 string
} from "../assets/beatmap";
import { useNavigate } from "react-router-dom";

// Re-add Constants for localStorage keys
// const LOCAL_STORAGE_BEATMAPS_KEY = "ryth_loadedBeatmaps"; // Removed
const LOCAL_STORAGE_LEADERBOARD_KEY = "ryth_localLeaderboard";

// Create a global state to share beatmap data between components
let globalBeatmapState = {
  currentBeatmap: null,
  allBeatmaps: [], // Beatmaps will now only be in memory for the session
  localLeaderboard: {}, // Store leaderboard data globally
};

// Function to set current beatmap globally
export const setGlobalCurrentBeatmap = (beatmap) => {
  globalBeatmapState.currentBeatmap = beatmap;
  console.log("Global beatmap set:", beatmap.metadata?.title);
};

// Function to get current beatmap globally
export const getGlobalCurrentBeatmap = () => {
  return globalBeatmapState.currentBeatmap;
};

// Function to add score to the global leaderboard
export const addScoreToGlobalLeaderboard = (beatmapId, scoreData) => {
  if (!globalBeatmapState.localLeaderboard[beatmapId]) {
    globalBeatmapState.localLeaderboard[beatmapId] = [];
  }
  // Ensure scoreData includes a judgements object with default values if not present
  const scoreToSave = {
    ...scoreData,
    judgements: {
      MARVELOUS: scoreData.judgements?.MARVELOUS || 0, // Added MARVELOUS
      PERFECT: scoreData.judgements?.PERFECT || 0,
      GREAT: scoreData.judgements?.GREAT || 0,
      GOOD: scoreData.judgements?.GOOD || 0,
      BAD: scoreData.judgements?.BAD || 0,
      MISS: scoreData.judgements?.MISS || 0,
      ...(scoreData.judgements || {}), // Merge any existing judgement properties
    },
  };

  globalBeatmapState.localLeaderboard[beatmapId].push(scoreToSave);

  // Sort scores from highest to lowest
  globalBeatmapState.localLeaderboard[beatmapId].sort(
    (a, b) => b.score - a.score
  );

  // Reinstated Save to localStorage
  try {
    localStorage.setItem(
      LOCAL_STORAGE_LEADERBOARD_KEY,
      JSON.stringify(globalBeatmapState.localLeaderboard)
    );
    console.log(
      "Score added to global leaderboard for beatmap and saved to localStorage:",
      beatmapId,
      scoreToSave
    );
  } catch (e) {
    console.error("Error saving leaderboard to localStorage:", e);
    if (e.name === "QuotaExceededError") {
      console.warn(
        "LocalStorage QuotaExceededError: Leaderboard data might be too large."
      );
    }
  }
};

export const useBeatmapLogic = () => {
  const [loadedBeatmaps, setLoadedBeatmaps] = useState([]);
  const [currentBeatmapDisplay, setCurrentBeatmapDisplay] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBeatmapForPlay, setSelectedBeatmapForPlay] = useState(null);
  const [localLeaderboard, setLocalLeaderboard] = useState(
    globalBeatmapState.localLeaderboard
  ); // Initialize from global state and allow updates
  const navigate = useNavigate();

  // Function to format beatmap data for display
  const formatBeatmapForDisplay = useCallback((beatmap) => {
    return {
      title: beatmap.metadata.title || "Unknown Title",
      artist: beatmap.metadata.artist || "Unknown Artist",
      mapper: beatmap.metadata.mapper || "Unknown Mapper",
      difficulty: beatmap.metadata.difficulty || "Unknown",
      length: beatmap.metadata.length || "0:00",
      bpm: beatmap.metadata.bpm || 0,
      objects: beatmap.metadata.objects || beatmap.hitObjects?.length || 0,
      circles:
        beatmap.metadata.circles ||
        beatmap.hitObjects?.filter((note) => note[2] === 0).length ||
        0,
      // Renamed from 'holds' to 'sliders' for consistency with display
      sliders:
        beatmap.metadata.holds ||
        beatmap.hitObjects?.filter((note) => note[2] === 1).length ||
        0,
      spinners: beatmap.metadata.spinners || 0,
      key: beatmap.metadata.difficulty || "Unknown",
      rating:
        beatmap.metadata.rating || beatmap.metadata.stars?.toFixed(1) || "0.0",
      stars: beatmap.metadata.stars || 0,
      keys: beatmap.metadata.keys || 4,
      // Unique ID for the beatmap to link scores
      id:
        beatmap.metadata.title +
        beatmap.metadata.difficulty +
        beatmap.metadata.mapper,
      // Include audioFile for display/preview purposes
      audioFile:
        beatmap.audioBase64 && beatmap.audioMimeType
          ? createBlobUrl(
              // Changed function name
              `data:${beatmap.audioMimeType};base64,${beatmap.audioBase64}`,
              beatmap.audioMimeType
            )
          : null,
      // NEW: Include backgroundImage for display
      backgroundImage:
        beatmap.imageBase64 && beatmap.imageMimeType
          ? createBlobUrl(
              // Changed function name
              `data:${beatmap.imageMimeType};base64,${beatmap.imageBase64}`,
              beatmap.imageMimeType
            )
          : null,
    };
  }, []);

  // Load beatmaps (only initial examples) and leaderboard on initial mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Beatmaps will no longer be loaded from localStorage.
      // They will only be the initial example beatmaps and any uploaded during the session.
      const finalBeatmaps = await loadDefaultBeatmaps();

      setLoadedBeatmaps(finalBeatmaps);
      globalBeatmapState.allBeatmaps = finalBeatmaps;

      if (finalBeatmaps.length > 0) {
        setCurrentBeatmapDisplay(formatBeatmapForDisplay(finalBeatmaps[0]));
        setSelectedBeatmapForPlay(finalBeatmaps[0]);
      } else {
        setCurrentBeatmapDisplay(null); // No beatmaps to display
        setSelectedBeatmapForPlay(null);
      }

      // Reinstated localStorage retrieval for leaderboard
      const storedLeaderboard = localStorage.getItem(
        LOCAL_STORAGE_LEADERBOARD_KEY
      );
      if (storedLeaderboard) {
        try {
          const parsedLeaderboard = JSON.parse(storedLeaderboard);
          setLocalLeaderboard(parsedLeaderboard);
          globalBeatmapState.localLeaderboard = parsedLeaderboard;
          console.log("Loaded leaderboard from localStorage.");
        } catch (e) {
          console.error(
            "Failed to parse local leaderboard from localStorage",
            e
          );
          localStorage.removeItem(LOCAL_STORAGE_LEADERBOARD_KEY); // Clear corrupted data
        }
      }

      //loadDefaultBeatmaps();
    };

    loadInitialData();
  }, [formatBeatmapForDisplay]); // Dependency on formatBeatmapForDisplay

  // Removed useEffect for saving loaded beatmaps to localStorage.
  // Beatmaps are now only stored in memory for the current session.

  // Function to set the beatmap whose details are displayed
  const setSelectedBeatmapForDisplay = useCallback(
    (beatmap) => {
      setCurrentBeatmapDisplay(formatBeatmapForDisplay(beatmap));
      setSelectedBeatmapForPlay(beatmap); // Also set it as the one to be played
    },
    [formatBeatmapForDisplay]
  );

  const fetchBeatmapManifest = async () => {
    try {
      const res = await fetch("/beatmaps/beatmaps.json");
      if (!res.ok) throw new Error("Failed to fetch beatmap manifest");
      const files = await res.json();
      return files;
    } catch (err) {
      console.error("Error fetching beatmap manifest:", err);
      return [];
    }
  };

  const loadDefaultBeatmaps = async () => {
    const beatmapFiles = await fetchBeatmapManifest();
    const finalBeatmaps = [];

    for (const filename of beatmapFiles) {
      try {
        const response = await fetch(`/beatmaps/${filename}`);
        if (!response.ok) {
          console.warn(`Failed to fetch ${filename}`);
          continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const beatmaps = await parseOszFile(arrayBuffer);
        finalBeatmaps.push(...beatmaps);
        console.log(`Loaded beatmaps from ${filename}:`, beatmaps);
      } catch (err) {
        console.error(`Failed to load ${filename}:`, err);
      }
    }

    return finalBeatmaps;
  };

  // Handle .osz file upload
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".osz")) {
      setError("Please select a valid .osz file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Parsing .osz file:", file.name);
      const newBeatmaps = await parseOszFile(file); // parseOszFile now attaches audioBase64/audioMimeType directly to beatmap object

      console.log("Parsed beatmaps:", newBeatmaps);

      if (newBeatmaps.length === 0) {
        throw new Error("No valid beatmaps found in the .osz file");
      }

      // Validate that beatmaps have hit objects
      const validBeatmaps = newBeatmaps.filter((beatmap) => {
        const hasHitObjects =
          beatmap.hitObjects && beatmap.hitObjects.length > 0;
        if (!hasHitObjects) {
          console.warn("Beatmap has no hit objects:", beatmap.metadata?.title);
        }
        return hasHitObjects;
      });

      if (validBeatmaps.length === 0) {
        throw new Error("No beatmaps with valid hit objects found");
      }

      // Add new beatmaps to the existing ones (in-memory only)
      // Ensure no duplicates based on a unique identifier (e.g., title + difficulty + mapper)
      const existingBeatmapIds = new Set(
        loadedBeatmaps.map(
          (b) => b.metadata.title + b.metadata.difficulty + b.metadata.mapper
        )
      );
      const uniqueNewBeatmaps = validBeatmaps.filter(
        (b) =>
          !existingBeatmapIds.has(
            b.metadata.title + b.metadata.difficulty + b.metadata.mapper
          )
      );

      if (uniqueNewBeatmaps.length === 0) {
        setError("All beatmaps from this .osz file are already loaded.");
        setIsLoading(false);
        event.target.value = "";
        return;
      }

      const updatedBeatmaps = [...loadedBeatmaps, ...uniqueNewBeatmaps];
      setLoadedBeatmaps(updatedBeatmaps);
      globalBeatmapState.allBeatmaps = updatedBeatmaps;

      // Set the first new unique beatmap as current display and for play
      setSelectedBeatmapForDisplay(uniqueNewBeatmaps[0]);

      console.log(
        "Successfully loaded new unique beatmaps:",
        uniqueNewBeatmaps.length
      );
    } catch (err) {
      console.error("Error parsing .osz file:", err);
      setError(`Error loading beatmap: ${err.message}`);
    } finally {
      setIsLoading(false);
      // Clear the file input
      event.target.value = "";
    }
  };

  // Handle beatmap selection for play (now called by the "Play" button)
  const handlePlayBeatmap = useCallback(
    (beatmap) => {
      try {
        console.log("Attempting to play beatmap:", beatmap.metadata.title);

        // Validate beatmap has hit objects
        if (!beatmap.hitObjects || beatmap.hitObjects.length === 0) {
          setError("This beatmap has no hit objects to play");
          return;
        }

        // Convert Base64 audio data back to Blob URL for playback
        let audioBlobUrl = null;
        // Prioritize audioBase64 from the beatmap object itself (which now comes from new upload or initialBeatmaps)
        if (beatmap.audioBase64 && beatmap.audioMimeType) {
          audioBlobUrl = createBlobUrl(
            // Changed function name
            `data:${beatmap.audioMimeType};base64,${beatmap.audioBase64}`,
            beatmap.audioMimeType
          );
          beatmap.metadata.audioFile = audioBlobUrl; // Attach for GameDisplay
          console.log("Audio Blob URL created from loaded data.");
        } else {
          console.warn(
            "No audio data found for this beatmap. Please re-upload the .osz file if you want audio."
          );
          beatmap.metadata.audioFile = null; // Ensure it's null if no audio
        }

        // Set the selected beatmap globally
        setGlobalCurrentBeatmap(beatmap);

        // Navigate to game
        navigate("/game");
      } catch (err) {
        console.error("Error starting beatmap:", err);
        setError(`Error starting beatmap: ${err.message}`);
      }
    },
    [navigate]
  ); // Dependency on navigate

  // Filter leaderboard for the currently displayed beatmap
  const currentBeatmapLeaderboard = currentBeatmapDisplay?.id
    ? localLeaderboard[currentBeatmapDisplay.id] || [] // Use localLeaderboard state
    : [];

  return {
    loadedBeatmaps,
    currentBeatmapDisplay,
    isLoading,
    error,
    handleFileChange,
    handlePlayBeatmap,
    leaderboard: currentBeatmapLeaderboard,
    navigate,
    setSelectedBeatmapForDisplay,
    selectedBeatmapForPlay,
  };
};
