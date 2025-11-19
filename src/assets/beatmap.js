// src/assets/beatmap.js
import JSZip from "jszip";

// Function to convert a base64 string to a Blob URL (renamed from createAudioBlobUrl)
const createBlobUrl = (base64String, mimeType) => {
  if (!base64String || !mimeType) return null;
  try {
    // If base64String already contains "data:mime/type;base64,", remove it
    const actualBase64 = base64String.startsWith(`data:${mimeType};base64,`)
      ? base64String.split(",")[1]
      : base64String;

    const byteString = atob(actualBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error decoding base64 string or creating Blob:", e);
    return null;
  }
};

// Function to create audio blob from binary data (not directly used for persistence, but kept for completeness)
const createAudioBlobFromBinary = (binaryData, mimeType) => {
  if (!binaryData || !mimeType) return null;
  try {
    const blob = new Blob([binaryData], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error creating audio blob:", e);
    return null;
  }
};

// NEW: Function to convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// NEW: Function to convert Base64 string to ArrayBuffer (not directly used for persistence, but kept for completeness)
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Function to parse .osu file content
const parseOsuFile = (content) => {
  const lines = content.split("\n");
  const metadata = {};
  const hitObjects = [];
  const timingPoints = [];

  let currentSection = "";

  for (let line of lines) {
    line = line.trim();

    if (line.startsWith("[") && line.endsWith("]")) {
      currentSection = line.slice(1, -1);
      continue;
    }

    if (line === "" || line.startsWith("//")) continue;

    switch (currentSection) {
      case "General":
        if (line.includes(":")) {
          const [key, value] = line.split(":").map((s) => s.trim());
          if (key === "AudioFilename") metadata.audioFilename = value;
          if (key === "Mode") metadata.mode = parseInt(value);
          if (key === "BackgroundFilename") metadata.backgroundFilename = value; // NEW: Get background filename
        }
        break;

      case "Metadata":
        if (line.includes(":")) {
          const [key, value] = line.split(":").map((s) => s.trim());
          if (key === "Title") metadata.title = value;
          if (key === "Artist") metadata.artist = value;
          if (key === "Creator") metadata.mapper = value;
          if (key === "Version") metadata.difficulty = value;
          if (key === "BeatmapID") metadata.beatmapId = parseInt(value);
          if (key === "BeatmapSetID") metadata.beatmapSetId = parseInt(value);
        }
        break;

      case "Difficulty":
        if (line.includes(":")) {
          const [key, value] = line.split(":").map((s) => s.trim());
          if (key === "CircleSize") metadata.keys = parseInt(value);
          if (key === "OverallDifficulty") metadata.od = parseFloat(value);
          if (key === "ApproachRate") metadata.ar = parseFloat(value);
          if (key === "HPDrainRate") metadata.hp = parseFloat(value);
        }
        break;

      case "TimingPoints":
        if (line.includes(",")) {
          const parts = line.split(",");
          if (parts.length >= 2) {
            timingPoints.push({
              time: parseFloat(parts[0]),
              beatLength: parseFloat(parts[1]),
              meter: parts[2] ? parseInt(parts[2]) : 4,
              sampleSet: parts[3] ? parseInt(parts[3]) : 1,
              sampleIndex: parts[4] ? parseInt(parts[4]) : 0,
              volume: parts[5] ? parseInt(parts[5]) : 100,
              uninherited: parts[6] ? parseInt(parts[6]) === 1 : true,
              effects: parts[7] ? parseInt(parts[7]) : 0,
            });
          }
        }
        break;

      case "HitObjects":
        if (line.includes(",")) {
          const parts = line.split(",");
          if (parts.length >= 4) {
            const x = parseInt(parts[0]);
            // eslint-disable-next-line no-unused-vars
            const y = parseInt(parts[1]);
            const time = parseInt(parts[2]);
            const type = parseInt(parts[3]);

            // Convert osu! coordinates to mania columns
            const column = Math.floor((x * (metadata.keys || 4)) / 512);

            // Check if it's a hold note (type & 128)
            if (type & 128) {
              // Hold note
              const endTime = parts[5]
                ? parseInt(parts[5].split(":")[0])
                : time + 100;
              hitObjects.push([time, column, 1, endTime]);
            } else {
              // Normal note
              hitObjects.push([time, column, 0]);
            }
          }
        }
        break;
    }
  }

  console.log(
    "Processed Beatmap '" +
      metadata.title +
      "' (DifficultyID " +
      metadata.beatmapId +
      " | BeatmapSetID " +
      metadata.beatmapSetId +
      ")"
  );

  // Calculate BPM from timing points
  const firstTimingPoint = timingPoints.find((tp) => tp.uninherited);
  if (firstTimingPoint) {
    metadata.bpm = Math.round(60000 / firstTimingPoint.beatLength);
  }

  return { metadata, hitObjects, timingPoints };
};

// Function to parse .osz file
export const parseOszFile = async (file) => {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);

    // Find .osu files
    const osuFiles = Object.keys(contents.files).filter(
      (filename) => filename.endsWith(".osu") && !contents.files[filename].dir
    );

    if (osuFiles.length === 0) {
      throw new Error("No .osu files found in the archive");
    }

    const beatmaps = [];

    // Store audio data and mime type once per .osz file
    let audioBase64 = null;
    let audioMimeType = null;
    let audioFilename = null;

    // NEW: Store background image data and mime type once per .osz file
    let imageBase64 = null;
    let imageMimeType = null;
    let imageFilename = null;

    // First pass to find the audio and image files
    for (const osuFilename of osuFiles) {
      const osuContent = await contents.files[osuFilename].async("text");
      const parsed = parseOsuFile(osuContent);

      // Find audio file
      if (parsed.metadata.audioFilename && !audioBase64) {
        const currentAudioFilename = parsed.metadata.audioFilename;
        if (contents.files[currentAudioFilename]) {
          const audioData = await contents.files[currentAudioFilename].async(
            "arraybuffer"
          );
          audioMimeType = getMimeTypeFromExtension(currentAudioFilename);
          audioBase64 = arrayBufferToBase64(audioData); // Convert to Base64
          audioFilename = currentAudioFilename;
          console.log(
            `Audio file '${audioFilename}' found and converted to Base64.`
          );
        } else {
          console.warn(
            `Audio file '${currentAudioFilename}' not found in .osz archive.`
          );
        }
      }

      // NEW: Find background image file
      if (parsed.metadata.backgroundFilename && !imageBase64) {
        const currentImageFilename = parsed.metadata.backgroundFilename;
        if (contents.files[currentImageFilename]) {
          const imageData = await contents.files[currentImageFilename].async(
            "arraybuffer"
          );
          imageMimeType = getMimeTypeFromExtension(currentImageFilename);
          imageBase64 = arrayBufferToBase64(imageData); // Convert to Base64
          imageFilename = currentImageFilename;
          console.log(
            `Background image '${imageFilename}' found and converted to Base64.`
          );
        } else {
          console.warn(
            `Background image '${currentImageFilename}' not found in .osz archive.`
          );
        }
      }
    }

    // Second pass to process each .osu file and attach the same audio/image data
    for (const osuFilename of osuFiles) {
      const osuContent = await contents.files[osuFilename].async("text");
      const parsed = parseOsuFile(osuContent);

      // Set default values if missing
      parsed.metadata.keys = parsed.metadata.keys || 4;
      parsed.metadata.mode = parsed.metadata.mode || 3; // 3 = osu!mania

      // Attach Base64 audio data and mime type
      parsed.audioBase64 = audioBase64;
      parsed.audioMimeType = audioMimeType;
      parsed.metadata.audioFilename = audioFilename;

      // NEW: Attach Base64 image data and mime type
      parsed.imageBase64 = imageBase64;
      parsed.imageMimeType = imageMimeType;
      parsed.metadata.backgroundFilename = imageFilename;

      // Calculate approximate length
      const lastNote = parsed.hitObjects.reduce(
        (max, note) => Math.max(max, note[3] || note[0]),
        0
      );
      parsed.metadata.length = formatTime(lastNote);

      // Calculate object count
      parsed.metadata.objects = parsed.hitObjects.length;
      parsed.metadata.circles = parsed.hitObjects.filter(
        (note) => note[2] === 0
      ).length;
      parsed.metadata.holds = parsed.hitObjects.filter(
        (note) => note[2] === 1
      ).length;
      parsed.metadata.spinners = 0; // mania doesn't have spinners

      // Calculate star rating (simplified)
      parsed.metadata.stars = calculateStarRating(
        parsed.hitObjects,
        parsed.metadata.keys
      );
      parsed.metadata.rating = parsed.metadata.stars.toFixed(1);

      beatmaps.push(parsed);
    }

    return beatmaps;
  } catch (error) {
    console.error("Error parsing .osz file:", error);
    throw error;
  }
};

// Helper function to get MIME type from file extension
const getMimeTypeFromExtension = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "ogg":
      return "audio/ogg";
    case "wav":
      return "audio/wav";
    case "m4a":
      return "audio/mp4";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream"; // Default for unknown types
  }
};

// Helper function to format time in mm:ss
const formatTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Simplified star rating calculation
const calculateStarRating = (hitObjects, keys) => {
  if (hitObjects.length === 0) return 0;

  // Basic difficulty calculation based on note density and patterns
  const totalTime = hitObjects[hitObjects.length - 1][0] - hitObjects[0][0];
  const noteRate = totalTime > 0 ? (hitObjects.length / totalTime) * 1000 : 0; // notes per second

  // Factor in key count
  const keyFactor = Math.pow(keys / 4, 0.5);

  // Basic star rating formula
  const stars = Math.min(10, Math.max(0.1, noteRate * keyFactor * 2));

  return stars;
};

// Export the parsing function for use in components
export {
  createBlobUrl, // Renamed export
  createAudioBlobFromBinary,
  arrayBufferToBase64,
  base64ToArrayBuffer,
};
