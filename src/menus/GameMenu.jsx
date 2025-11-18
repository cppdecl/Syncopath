import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getGlobalCurrentBeatmap,
  addScoreToGlobalLeaderboard,
} from "../hooks/useBeatmapLogic"; // Import addScoreToGlobalLeaderboard

const GameMenu = () => {
  const navigate = useNavigate();
  const currentBeatmap = getGlobalCurrentBeatmap();

  // State for game logic
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(1.0);
  const [judgement, setJudgement] = useState("");
  const [gameNotes, setGameNotes] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Refs for game logic
  const audioRef = useRef(null);
  const gameAreaRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const totalPauseTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const keyState = useRef([false, false, false, false]);
  const totalNotesHit = useRef(0);
  const totalNotesMissed = useRef(0);
  const totalNotesCount = useRef(0);
  const scorePerPerfectHit = useRef(0);
  const judgementTimeoutRef = useRef(null);

  // Updated accuracy tracking
  const accuracyScore = useRef(0);
  const totalAccuracyPossible = useRef(0);

  // Hold note tracking - updated for tail-based judgment
  const activeHoldNotes = useRef(new Map()); // Track currently held notes
  const holdNoteStartScores = useRef(new Map()); // Track start hit scores for hold notes

  // Game constants
  const keyWidth = 120;
  const hitPosition = 80;
  const scrollSpeed = 1500;

  // Judgement windows (in milliseconds) - MADE EASIER
  const judgementWindows = {
    marvelous: 50, // New MARVELOUS window
    perfect: 100, // Increased from 50
    great: 200, // Increased from 100
    good: 300, // Increased from 150
    bad: 400, // Increased from 200
  };

  // Accuracy values for each judgement
  const accuracyValues = {
    MARVELOUS: 1.0, // MARVELOUS gives full accuracy
    PERFECT: 1.0, // Adjusted PERFECT accuracy
    GREAT: 0.8,
    GOOD: 0.6,
    BAD: 0.3,
    MISS: 0.0,
  };

  // Judgement counts for score display
  const judgementCounts = useRef({
    MARVELOUS: 0, // New MARVELOUS count
    PERFECT: 0,
    GREAT: 0,
    GOOD: 0,
    BAD: 0,
    MISS: 0,
  });
  const maxComboRef = useRef(0);

  // Check if beatmap exists
  if (!currentBeatmap) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No beatmap selected</p>
          <button
            onClick={() => navigate("/play")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg"
          >
            Back to Beatmaps
          </button>
        </div>
      </div>
    );
  }

  // Pause/Resume functions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pauseGame = () => {
    if (!gameStarted || gameEnded || gamePaused) return;

    setGamePaused(true);
    pauseTimeRef.current = Date.now();

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resumeGame = () => {
    if (!gamePaused) return;

    setGamePaused(false);

    // Calculate total pause time
    totalPauseTimeRef.current += Date.now() - pauseTimeRef.current;

    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Restart game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const restartGame = () => {
    setGamePaused(false);
    setGameStarted(false);
    setGameEnded(false);
    totalPauseTimeRef.current = 0;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset will trigger auto-start
    setTimeout(() => {
      startGame();
    }, 100);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const exitGame = () => {
    navigate("/play");
  };

  // Initialize game notes and scoring on beatmap load
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (currentBeatmap && currentBeatmap.hitObjects) {
      // Include both normal notes (type 0) and hold notes (type 1)
      const initialGameNotes = currentBeatmap.hitObjects.map((note) => ({
        time: note[0],
        column: note[1],
        type: note[2],
        endTime: note[3] || note[0], // For hold notes, endTime is the 4th element
        status: "pending",
        holdStartHit: false, // Track if the hold note start was hit
        holdProgress: 0, // Visual progress indicator
      }));
      setGameNotes(initialGameNotes);

      totalNotesCount.current = initialGameNotes.length;
      if (totalNotesCount.current > 0) {
        scorePerPerfectHit.current = 1000000 / totalNotesCount.current;
        totalAccuracyPossible.current = totalNotesCount.current;
      }
    }
  }, [currentBeatmap]);

  // Calculate note position based on current time
  const calculateNotePosition = (note, gameTime) => {
    const gameAreaHeight =
      gameAreaRef.current?.clientHeight || window.innerHeight;
    const hitPositionPx = (hitPosition / 100) * gameAreaHeight;
    const noteBaseHeight = 30;

    if (note.status === "hit" || note.status === "missed") {
      return null;
    }

    if (note.type === 0) {
      // Normal note
      const timeDiff = note.time - gameTime;
      const travelDistance = (timeDiff / 1000) * scrollSpeed;
      const noteTop = hitPositionPx - travelDistance;

      return {
        top: noteTop,
        height: noteBaseHeight,
        opacity: 1,
      };
    } else if (note.type === 1) {
      // Hold note
      const startTimeDiff = note.time - gameTime;
      const endTimeDiff = note.endTime - gameTime;
      const startTravelDistance = (startTimeDiff / 1000) * scrollSpeed;
      const endTravelDistance = (endTimeDiff / 1000) * scrollSpeed;

      const noteTop = hitPositionPx - startTravelDistance;
      const noteEnd = hitPositionPx - endTravelDistance;
      const noteHeight = Math.max(noteBaseHeight, noteTop - noteEnd);

      return {
        top: noteEnd,
        height: noteHeight,
        opacity: 1,
      };
    }

    return null;
  };

  // Get notes to render
  const getNotesToRender = (gameTime) => {
    return gameNotes.filter((note) => {
      if (note.status === "hit" || note.status === "missed") return false;

      const gameAreaHeight =
        gameAreaRef.current?.clientHeight || window.innerHeight;
      const notePosition = calculateNotePosition(note, gameTime);

      if (!notePosition) return false;

      // Check if note is within visible area
      const noteBottom = notePosition.top + notePosition.height;
      const noteTop = notePosition.top;

      return noteBottom > -100 && noteTop < gameAreaHeight + 100;
    });
  };

  // Updated accuracy calculation
  const updateAccuracy = (judgement) => {
    accuracyScore.current += accuracyValues[judgement];
    const totalProcessed = totalNotesHit.current + totalNotesMissed.current;

    if (totalProcessed > 0) {
      setAccuracy(accuracyScore.current / totalProcessed);
    }
  };

  // Handle hit for normal notes and hold note start
  const handleHit = (note, judgement) => {
    let scoreIncrease = 0;
    let isHit = true;

    if (judgement === "MARVELOUS") {
      scoreIncrease = scorePerPerfectHit.current; // MARVELOUS gives slightly more score
    } else if (judgement === "PERFECT") {
      scoreIncrease = scorePerPerfectHit.current * 0.95;
    } else if (judgement === "GREAT") {
      scoreIncrease = scorePerPerfectHit.current * 0.7;
    } else if (judgement === "GOOD") {
      scoreIncrease = scorePerPerfectHit.current * 0.4;
    } else if (judgement === "BAD") {
      scoreIncrease = scorePerPerfectHit.current * 0.1;
    } else {
      scoreIncrease = 0;
      isHit = false;
    }

    setScore((prev) => Math.min(prev + scoreIncrease, 1000000));
    setCombo((prev) => {
      const newCombo = judgement === "MISS" ? 0 : prev + 1;
      maxComboRef.current = Math.max(maxComboRef.current, newCombo);
      return newCombo;
    });
    setJudgement(judgement);

    if (isHit) {
      totalNotesHit.current += 1;
    } else {
      totalNotesMissed.current += 1;
    }

    // Increment judgement count
    judgementCounts.current[judgement]++;

    // Update accuracy with the new system
    updateAccuracy(judgement);

    // Clear judgement after delay
    if (judgementTimeoutRef.current) {
      clearTimeout(judgementTimeoutRef.current);
    }
    judgementTimeoutRef.current = setTimeout(() => setJudgement(""), 500);
  };

  // Update hold note visual progress
  const updateHoldNoteProgress = (gameTime) => {
    activeHoldNotes.current.forEach((note) => {
      const column = note.column;
      const isKeyHeld = keyState.current[column];

      if (isKeyHeld && gameTime >= note.time && gameTime <= note.endTime) {
        // Update visual progress
        const holdDuration = note.endTime - note.time;
        const timeHeld = gameTime - note.time;
        const progress = Math.min(timeHeld / holdDuration, 1);

        setGameNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.time === note.time && n.column === note.column
              ? { ...n, holdProgress: progress }
              : n
          )
        );
      }
    });
  };

  // Check for hits - updated for both normal and hold notes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkForHits = (pressedColumn) => {
    const gameTime =
      Date.now() - startTimeRef.current - totalPauseTimeRef.current;

    const potentialNotes = gameNotes.filter(
      (note) =>
        note.column === pressedColumn &&
        note.status === "pending" &&
        Math.abs(gameTime - note.time) <= judgementWindows.bad
    );

    if (potentialNotes.length === 0) return;

    potentialNotes.sort(
      (a, b) => Math.abs(gameTime - a.time) - Math.abs(gameTime - b.time)
    );
    const noteToHit = potentialNotes[0];

    const timeDiff = gameTime - noteToHit.time;
    let currentJudgement;

    if (Math.abs(timeDiff) <= judgementWindows.marvelous)
      currentJudgement = "MARVELOUS";
    else if (Math.abs(timeDiff) <= judgementWindows.perfect)
      currentJudgement = "PERFECT";
    else if (Math.abs(timeDiff) <= judgementWindows.great)
      currentJudgement = "GREAT";
    else if (Math.abs(timeDiff) <= judgementWindows.good)
      currentJudgement = "GOOD";
    else currentJudgement = "BAD";

    if (noteToHit.type === 0) {
      // Normal note - mark as hit immediately
      setGameNotes((prev) =>
        prev.map((n) =>
          n.time === noteToHit.time && n.column === noteToHit.column
            ? { ...n, status: "hit" }
            : n
        )
      );
      handleHit(noteToHit, currentJudgement);
    } else if (noteToHit.type === 1) {
      // Hold note - start tracking it and mark start as hit
      const noteKey = `${noteToHit.time}-${noteToHit.column}`;
      activeHoldNotes.current.set(noteKey, noteToHit);
      holdNoteStartScores.current.set(noteKey, currentJudgement);

      // Mark hold note start as hit and update visual state
      setGameNotes((prev) =>
        prev.map((n) =>
          n.time === noteToHit.time && n.column === noteToHit.column
            ? { ...n, holdStartHit: true }
            : n
        )
      );

      // Give score for hitting the start of the hold note (50% of total score)
      const startScore = scorePerPerfectHit.current * 0.5;
      let startScoreMultiplier = 1;
      if (currentJudgement === "MARVELOUS") startScoreMultiplier = 1;
      else if (currentJudgement === "PERFECT") startScoreMultiplier = 0.95;
      else if (currentJudgement === "GREAT") startScoreMultiplier = 0.7;
      else if (currentJudgement === "GOOD") startScoreMultiplier = 0.4;
      else if (currentJudgement === "BAD") startScoreMultiplier = 0.1;

      setScore((prev) =>
        Math.min(prev + startScore * startScoreMultiplier, 1000000)
      );

      // Don't show judgment for hold note start - wait for release
      // Don't count combo/accuracy yet - wait for tail release
    }
  };

  // Check for hold note releases - NEW: Judge based on tail timing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkForHoldReleases = (releasedColumn) => {
    const gameTime =
      Date.now() - startTimeRef.current - totalPauseTimeRef.current;

    // Check if any active hold notes are being released
    activeHoldNotes.current.forEach((note, noteKey) => {
      if (note.column === releasedColumn) {
        // Calculate timing difference from the tail (endTime)
        const tailTimeDiff = gameTime - note.endTime;
        const startJudgement = holdNoteStartScores.current.get(noteKey);

        let tailJudgement;
        if (Math.abs(tailTimeDiff) <= judgementWindows.marvelous) {
          tailJudgement = "MARVELOUS";
        } else if (Math.abs(tailTimeDiff) <= judgementWindows.perfect) {
          tailJudgement = "PERFECT";
        } else if (Math.abs(tailTimeDiff) <= judgementWindows.great) {
          tailJudgement = "GREAT";
        } else if (Math.abs(tailTimeDiff) <= judgementWindows.good) {
          tailJudgement = "GOOD";
        } else if (Math.abs(tailTimeDiff) <= judgementWindows.bad) {
          tailJudgement = "BAD";
        } else {
          tailJudgement = "MISS";
        }

        // Calculate final score for tail (50% of total score)
        const tailScore = scorePerPerfectHit.current * 0.5;
        let tailScoreMultiplier = 1;
        if (tailJudgement === "MARVELOUS") tailScoreMultiplier = 1;
        else if (tailJudgement === "PERFECT") tailScoreMultiplier = 0.95;
        else if (tailJudgement === "GREAT") tailScoreMultiplier = 0.7;
        else if (tailJudgement === "GOOD") tailScoreMultiplier = 0.4;
        else if (tailJudgement === "BAD") tailScoreMultiplier = 0.1;
        else if (tailJudgement === "MISS") tailScoreMultiplier = 0;

        // Add tail score
        setScore((prev) =>
          Math.min(prev + tailScore * tailScoreMultiplier, 1000000)
        );

        // Determine overall judgement (take the worse of start and tail)
        let finalJudgement;
        const judgementPriority = {
          MARVELOUS: 5, // New priority for MARVELOUS
          PERFECT: 4,
          GREAT: 3,
          GOOD: 2,
          BAD: 1,
          MISS: 0,
        };

        if (
          judgementPriority[tailJudgement] < judgementPriority[startJudgement]
        ) {
          finalJudgement = tailJudgement;
        } else {
          finalJudgement = startJudgement;
        }

        // Mark hold note as complete
        setGameNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.time === note.time && n.column === note.column
              ? { ...n, status: "hit", holdProgress: 1 }
              : n
          )
        );

        // Clean up tracking
        activeHoldNotes.current.delete(noteKey);
        holdNoteStartScores.current.delete(noteKey);

        // Update stats and combo based on final judgement
        if (finalJudgement !== "MISS") {
          totalNotesHit.current += 1;
          setCombo((prev) => {
            const newCombo = prev + 1;
            maxComboRef.current = Math.max(maxComboRef.current, newCombo);
            return newCombo;
          });
        } else {
          totalNotesMissed.current += 1;
          setCombo(0);
        }

        // Increment judgement count for the final judgement
        judgementCounts.current[finalJudgement]++;

        // Update accuracy with the new system
        updateAccuracy(finalJudgement);

        // Show only the final judgement (no extra text)
        setJudgement(finalJudgement);

        // Clear judgement after delay
        if (judgementTimeoutRef.current) {
          clearTimeout(judgementTimeoutRef.current);
        }
        judgementTimeoutRef.current = setTimeout(() => setJudgement(""), 500);
      }
    });
  };

  // Check missed notes - updated for both normal and hold notes
  const checkMissedNotes = (gameTime) => {
    setGameNotes((prevNotes) => {
      let hasChanges = false;
      const updatedNotes = prevNotes.map((note) => {
        if (note.status === "pending") {
          if (note.type === 0 && gameTime - note.time > judgementWindows.bad) {
            // Normal note missed
            hasChanges = true;
            handleHit(note, "MISS");
            return { ...note, status: "missed" };
          } else if (
            note.type === 1 &&
            gameTime - note.time > judgementWindows.bad &&
            !note.holdStartHit
          ) {
            // Hold note start missed
            hasChanges = true;
            handleHit(note, "MISS");
            return { ...note, status: "missed" };
          } else if (
            note.type === 1 &&
            gameTime - note.endTime > judgementWindows.bad &&
            note.holdStartHit
          ) {
            // Hold note tail missed (key not released in time)
            const noteKey = `${note.time}-${note.column}`;
            if (activeHoldNotes.current.has(noteKey)) {
              hasChanges = true;

              // Clean up tracking
              activeHoldNotes.current.delete(noteKey);
              holdNoteStartScores.current.delete(noteKey);

              // Update stats
              totalNotesMissed.current += 1;
              setCombo(0);

              // Increment MISS judgement count
              judgementCounts.current["MISS"]++;

              // Update accuracy with the new system
              updateAccuracy("MISS");

              // Show only MISS (no extra text)
              setJudgement("MISS");

              return { ...note, status: "missed", holdProgress: 1 };
            }
          }
        }
        return note;
      });

      return hasChanges ? updatedNotes : prevNotes;
    });
  };

  // Game loop
  const gameLoop = () => {
    if (!gameStarted || gameEnded || gamePaused) return;

    const gameTime =
      Date.now() - startTimeRef.current - totalPauseTimeRef.current;
    setCurrentTime(gameTime);
    checkMissedNotes(gameTime);
    updateHoldNoteProgress(gameTime);

    // Check if game should end
    const allNotesProcessed = gameNotes.every(
      (note) => note.status === "hit" || note.status === "missed"
    );
    // FIX: Removed the problematic `gameNotes.length > 0` condition
    if (allNotesProcessed && activeHoldNotes.current.size === 0) {
      setGameEnded(true);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Store score data in session storage before navigating
      const finalScoreData = {
        score: score,
        accuracy: accuracy * 100,
        maxCombo: maxComboRef.current,
        judgements: judgementCounts.current,
        beatmapId:
          currentBeatmap.metadata.title +
          currentBeatmap.metadata.difficulty +
          currentBeatmap.metadata.mapper, // Pass beatmap ID
      };
      sessionStorage.setItem("lastGameScore", JSON.stringify(finalScoreData));

      // Add score to global leaderboard immediately after game ends
      const playerName = "samam123king"; // For simplicity, using a static name
      const scoreEntry = {
        player: playerName,
        score: score, // Use current score
        accuracy: accuracy * 100, // Use current accuracy
        combo: maxComboRef.current, // Use current max combo
        pp: Math.floor(score / 10000), // Simple PP calculation for display
        judgements: judgementCounts.current, // Pass judgements
      };
      addScoreToGlobalLeaderboard(
        currentBeatmap.metadata.title +
          currentBeatmap.metadata.difficulty +
          currentBeatmap.metadata.mapper,
        scoreEntry
      );

      navigate("/score"); // Navigate to the new score display page
      return;
    }

    // Continue the game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  // Start game
  const startGame = () => {
    console.log("Starting game...");
    setScore(0);
    setCombo(0);
    setAccuracy(1.0);
    setJudgement("");
    setCurrentTime(0);
    setGameEnded(false);
    setGamePaused(false);
    totalNotesHit.current = 0;
    totalNotesMissed.current = 0;
    accuracyScore.current = 0;
    totalPauseTimeRef.current = 0;
    keyState.current = [false, false, false, false];
    activeHoldNotes.current.clear();
    holdNoteStartScores.current.clear();
    judgementCounts.current = {
      MARVELOUS: 0, // Reset MARVELOUS count
      PERFECT: 0,
      GREAT: 0,
      GOOD: 0,
      BAD: 0,
      MISS: 0,
    }; // Reset judgement counts
    maxComboRef.current = 0; // Reset max combo

    setGameNotes((prevNotes) =>
      prevNotes.map((note) => ({
        ...note,
        status: "pending",
        holdStartHit: false,
        holdProgress: 0,
      }))
    );

    setGameStarted(true);

    // Start the game loop
    startTimeRef.current = Date.now();

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  };

  // Game loop effect
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (gameStarted && !gameEnded && !gamePaused) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameStarted,
    gameEnded,
    gamePaused,
    gameNotes,
    score,
    accuracy,
    combo,
    navigate,
  ]);

  // Auto-start game effect
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!gameStarted && !gameEnded && currentBeatmap && gameNotes.length > 0) {
      console.log("Auto-starting game in 1 second...");
      const timer = setTimeout(() => {
        startGame();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, gameEnded, currentBeatmap, gameNotes.length]);

  // Keyboard event handlers - updated for hold notes and pause
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle pause key (Space or Escape)
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (gameStarted && !gameEnded) {
          if (gamePaused) {
            resumeGame();
          } else {
            pauseGame();
          }
        }
        return;
      }

      if (e.key === "Escape") {
        if (gamePaused) {
          exitGame();
        } else if (gameStarted && !gameEnded) {
          pauseGame();
        } else {
          navigate("/play");
        }
        return;
      }

      if (!gameStarted || gameEnded || gamePaused) return;

      const keyMap = ["KeyA", "KeyS", "KeyL", "Semicolon"];
      const index = keyMap.indexOf(e.code);
      if (index >= 0 && !keyState.current[index]) {
        keyState.current[index] = true;
        checkForHits(index);
      }
    };

    const handleKeyUp = (e) => {
      if (!gameStarted || gameEnded || gamePaused) return;

      const keyMap = ["KeyA", "KeyS", "KeyL", "Semicolon"];
      const index = keyMap.indexOf(e.code);
      if (index >= 0) {
        keyState.current[index] = false;
        checkForHoldReleases(index);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    gameStarted,
    gameEnded,
    gamePaused,
    navigate,
    resumeGame,
    pauseGame,
    exitGame,
    checkForHits,
    checkForHoldReleases,
  ]);

  // Cleanup effect
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (judgementTimeoutRef.current) {
        clearTimeout(judgementTimeoutRef.current);
        judgementTimeoutRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        audioRef.current.currentTime = 0;
        // Revoke the Blob URL to free up memory
        if (currentBeatmap?.metadata?.audioFile) {
          URL.revokeObjectURL(currentBeatmap.metadata.audioFile);
          console.log("Revoked audio Blob URL.");
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      activeHoldNotes.current.clear();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      holdNoteStartScores.current.clear();
    };
  }, [currentBeatmap]); // Added currentBeatmap to dependency array for cleanup

  const notesToRender = getNotesToRender(currentTime);

  // Note size for normal and hold note heads/tails
  const noteSize = 100; // Increased from 40

  return (
    <div className="relative h-screen bg-black text-white overflow-hidden flex justify-center items-center">
      {/* Audio element */}
      {currentBeatmap.metadata.audioFile && (
        <audio
          ref={audioRef}
          src={currentBeatmap.metadata.audioFile}
          preload="auto"
        />
      )}

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900 to-black opacity-90"></div>

      {/* Score Display */}
      <div className="absolute top-4 right-4 text-4xl font-bold text-white z-20">
        {Math.floor(score).toLocaleString()}
      </div>

      {/* Accuracy Display */}
      <div className="absolute top-16 right-4 text-xl text-white z-20">
        {(accuracy * 100).toFixed(2)}%
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="relative h-full"
        style={{ width: `${currentBeatmap.metadata.keys * keyWidth}px` }}
      >
        {/* Key Lanes - updated for circular design and black background */}
        <div className="absolute inset-0 flex ">
          {[...Array(currentBeatmap.metadata.keys)].map((_, i) => (
            <div
              key={i}
              className="flex-1 flex justify-center items-end bg-black bg-opacity-50" // Added black background with opacity
              style={{ width: `${keyWidth}px` }}
            >
              {/* Circular key indicator at bottom */}
              <div
                className={`w-26 h-26 rounded-full border-4 mb-24 transition-colors duration-100 ${
                  keyState.current[i]
                    ? "border-white bg-white bg-opacity-30"
                    : "border-gray-600"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Notes - updated for circular design and increased size */}
        {notesToRender.map((note, index) => {
          const position = calculateNotePosition(note, currentTime);
          if (!position) return null;

          if (note.type === 0) {
            // Normal note - now circular and bigger
            return (
              <div
                key={`${note.time}-${note.column}-${index}`}
                className="absolute rounded-full z-5 bg-white flex justify-center"
                style={{
                  left: `${
                    note.column * keyWidth + keyWidth / 2 - noteSize / 2
                  }px`,
                  width: `${noteSize}px`,
                  height: `${noteSize}px`,
                  top: `${position.top}px`,
                  opacity: position.opacity,
                  transform: "translateY(-50%)",
                }}
              />
            );
          } else if (note.type === 1) {
            // Hold note - now with circular ends and bigger
            const noteKey = `${note.time}-${note.column}`;
            const isActive = activeHoldNotes.current.has(noteKey);
            const progress = note.holdProgress || 0;
            const isStartHit = note.holdStartHit;

            return (
              <div
                key={`${note.time}-${note.column}-${index}`}
                className="absolute z-5"
                style={{
                  left: `${
                    note.column * keyWidth + keyWidth / 2 - noteSize / 2
                  }px`,
                  width: `${noteSize}px`,
                  top: `${position.top}px`,
                  height: `${position.height}px`,
                  opacity: position.opacity,
                }}
              >
                {/* Hold note body */}
                <div
                  className={`w-full mx-auto rounded-t-full ${
                    // Added rounded-md here
                    isActive
                      ? "bg-white"
                      : isStartHit
                      ? "bg-white"
                      : "bg-gray-100"
                  } opacity-70`}
                  style={{
                    width: `${noteSize}px`, // Half the note size for the body width
                    height: "100%",
                  }}
                />

                {/* Hold note progress indicator */}
                {isActive && (
                  <div
                    className="absolute w-full mx-auto bg-gray-400 transition-all duration-100"
                    style={{
                      width: `${noteSize / 2}px`,
                      height: `${progress * 100}%`,
                      opacity: 0.6,
                      marginLeft: `${noteSize / 4}px`,
                      bottom: 0,
                    }}
                  />
                )}

                {/* Circular Hold note tail */}
                <div
                  className={`absolute rounded-full ${
                    isActive
                      ? "bg-gray-300"
                      : isStartHit
                      ? "bg-blue-300"
                      : "bg-blue-400"
                  }`}
                  style={{
                    width: `${noteSize}px`,
                    height: `${noteSize}px`,
                    bottom: `-${noteSize / 2}px`, // Position below the body
                    left: 0,
                  }}
                />
              </div>
            );
          }

          return null;
        })}

        {/* Judgement Display - updated for circular design and higher position */}
        {judgement && (
          <div
            className="absolute z-30"
            style={{
              left: "50%",
              top: "35%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className={`text-4xl font-bold text-center ${
                judgement.includes("MARVELOUS")
                  ? "text-purple-300" // Color for MARVELOUS
                  : judgement.includes("PERFECT")
                  ? "text-yellow-300"
                  : judgement.includes("GREAT")
                  ? "text-green-400"
                  : judgement.includes("GOOD")
                  ? "text-blue-400"
                  : judgement.includes("BAD")
                  ? "text-red-400"
                  : "text-gray-400"
              }`}
            >
              {judgement}
            </div>
            {/* Combo Display - now with circular background */}
            {combo > 0 && (
              <div className="flex justify-center mt-2">
                <div className="px-6 py-2">
                  <span className="text-2xl text-yellow-400 font-bold">
                    {combo}x
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pause Menu */}
        {gamePaused && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center border-2 border-blue-500">
              <h2 className="text-5xl font-extrabold text-blue-400 mb-8 animate-pulse">
                PAUSED
              </h2>
              <div className="space-y-4">
                <button
                  onClick={resumeGame}
                  className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-2xl font-semibold rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Resume Game
                </button>
                <button
                  onClick={restartGame}
                  className="w-full px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white text-2xl font-semibold rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Restart Game
                </button>
                <button
                  onClick={exitGame}
                  className="w-full px-8 py-4 bg-red-600 hover:bg-red-500 text-white text-2xl font-semibold rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Exit to Beatmaps
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-8">
                Press ESC or Space to resume
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameMenu;
