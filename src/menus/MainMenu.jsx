import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MainMenu() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  const minScale = 0.8;
  const threshold = 0.68;
  const smoothing = 0.3;
  const sensitivity = 0.7;
  const maxScale = 2.0;

  const [scale, setScale] = useState(1);
  const [started, setStarted] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const snowConfig = {
    amount: 150,
    gravity: 0.2,
    wind: 0,
    sizeMin: 2,
    sizeMax: 6,
    speedMin: 0.1,
    speedMax: 0.5,
    color: "white",
  };

  useEffect(() => {
    function handleMouseMove(e) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      const dx = (cx - e.clientX) / cx;
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

  useEffect(() => {
    if (!started) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];

    const snowDelay = 1000;

    const createParticles = () => {
      for (let i = 0; i < snowConfig.amount; i++) {
        particles.push({
          x: Math.random() * width,
          y: -Math.random() * height,
          r:
            snowConfig.sizeMin +
            Math.random() * (snowConfig.sizeMax - snowConfig.sizeMin),
          dx: snowConfig.wind + (Math.random() - 0.5) * 0.2,
          dy:
            snowConfig.speedMin +
            Math.random() * (snowConfig.speedMax - snowConfig.speedMin),
        });
      }
    };

    setTimeout(() => {
      createParticles();
      draw();
    }, snowDelay);

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = snowConfig.color;
      ctx.beginPath();
      for (let p of particles) {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx.fill();
      update();
      requestAnimationFrame(draw);
    }

    function update() {
      for (let p of particles) {
        p.x += p.dx + snowConfig.wind;
        p.y += p.dy + snowConfig.gravity;

        if (p.y > height) {
          p.y = -p.r; // restart at top
          p.x = Math.random() * width;
        }

        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
      }
    }

    function handleResize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [started]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#100e1bff",
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

      {/* Snow canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* VIEWPORT / MOVING LAYER */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: "transform 0.1s ease-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
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
              background: "#c72e69ff",
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
