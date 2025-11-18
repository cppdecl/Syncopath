import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MainMenu() {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const minScale = 0.8;
  const threshold = 0.68;
  const smoothing = 0.3;
  const sensitivity = 0.7;
  const maxScale = 2.0;

  const [scale, setScale] = useState(1);
  const [started, setStarted] = useState(false);

  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(e) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      const dx = (cx - e.clientX) / cx; // inverse movement
      const dy = (cy - e.clientY) / cy;

      const strength = 30;

      setOffset({
        x: dx * strength,
        y: dy * strength,
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (!started) return;

    const audio = new Audio("/Theme.mp3");
    audio.loop = true;
    audio.volume = 1;
    audioRef.current = audio;

    audio
      .play()
      .then(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        ctx.resume();

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function tick() {
          analyser.getByteFrequencyData(dataArray);

          const bass = (dataArray[1] + dataArray[2] + dataArray[3]) / (3 * 255);
          if (bass < threshold) {
            setScale((prev) => prev + (1 - prev) * smoothing);
          } else {
            const targetScale = 1 + bass * sensitivity;
            setScale((prev) => {
              const newScale = prev + (targetScale - prev) * smoothing;
              return Math.max(minScale, Math.min(maxScale, newScale));
            });
          }

          requestAnimationFrame(tick);
        }

        tick();
      })
      .catch(() => {
        console.warn("Autoplay failed, user gesture still needed.");
      });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [started]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#100e1bff", // super dark purple
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!started && (
        <div
          onClick={() => setStarted(true)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: "#100e1bff",
            color: "white",
            fontSize: "3rem",
            zIndex: 10,
          }}
        >
          Click to Play
        </div>
      )}

      {/* VIEWPORT / MOVING LAYER */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: "transform 0.1s ease-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* OUTER WHITE CIRCLE */}
        <div
          style={{
            width: "35vh",
            height: "35vh",
            borderRadius: "50%",
            background: "white",
            transform: `scale(${scale})`,
            transition: "transform 0.05s linear",
            willChange: "transform",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* INNER PURPLE CIRCLE */}
          <div
            style={{
              width: "90%",
              height: "90%",
              borderRadius: "50%",
              background: "#c72e69ff", // purple
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1
              style={{
                color: "white",
                fontSize: "2.5rem",
                fontWeight: "bold",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                textAlign: "center",
                lineHeight: "35vh",
                userSelect: "none",
              }}
            >
              Syncopath
            </h1>
          </div>
        </div>
      </div>

      <style>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
