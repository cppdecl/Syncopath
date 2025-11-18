import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MainMenu() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  const minScale = 1.6;
  const threshold = 0.58;
  const smoothing = 0.3;
  const sensitivity = 0.7;
  const maxScale = 2.0;

  const [scale, setScale] = useState(1);
  const [started, setStarted] = useState(false);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rawMouse, setRawMouse] = useState({ x: 0, y: 0 });

  const [menuOpen, setMenuOpen] = useState(false);

  const [hovered, setHovered] = useState(null);

  const buttonLabels = ["Play", "Beatmaps", "Options", "Quit"];
  const [visibleButtons, setVisibleButtons] = useState(
    Array(buttonLabels.length).fill(false)
  );

  const openMenu = () => {
    setMenuOpen(true);
    buttonLabels.forEach((_, i) => {
      setTimeout(() => {
        setVisibleButtons((prev) => {
          const copy = [...prev];
          copy[i] = true;
          return copy;
        });
      }, i * 150);
    });
  };

  const closeMenu = () => {
    buttonLabels
      .slice()
      .reverse()
      .forEach((_, i) => {
        setTimeout(() => {
          setVisibleButtons((prev) => {
            const copy = [...prev];
            copy[buttonLabels.length - 1 - i] = false;
            return copy;
          });
        }, i * 100);
      });
    setTimeout(() => setMenuOpen(false), buttonLabels.length * 100);
  };

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
    function handleKey(e) {
      if (e.key === "Escape") {
        if (menuOpen) {
          closeMenu();
        } else {
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    function handleMouseMove(e) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      const dx = (cx - e.clientX) / cx;
      const dy = (cy - e.clientY) / cy;
      const strength = 30;

      setRawMouse({
        x: dx * strength,
        y: dy * strength,
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    setOffset(rawMouse);
  }, [rawMouse]);

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
          p.y = -p.r;
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
            zIndex: 10000,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          }}
        >
          Click to Play
        </div>
      )}

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

      <div
        style={{
          position: "absolute",
          transform: `translate(${offset.x + (menuOpen ? 8 * 10 : 220)}px, ${
            offset.y
          }px)`,
          transition: "transform 0.3s ease-out",
          display: "flex",
          alignItems: "center",
          gap: "3rem",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: "35vh",
            height: "35vh",
            borderRadius: "50%",
            background: "white",
            transform: `scale(${scale})`,
            transition: "transform 0.05s linear",
            willChange: "transform",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
            style={{
              width: "90%",
              height: "90%",
              borderRadius: "50%",
              background: "#c72e69ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            zIndex: 1,
          }}
        >
          {buttonLabels.map((label, i) => (
            <div
              key={label}
              onMouseEnter={() => setHovered(label)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === label ? "#df1264ff" : "#e64784ff",
                color: hovered === label ? "white" : "#ffabcbff",
                padding: hovered === label ? "1.1rem 2.5rem" : "0.9rem 1.5rem",
                fontSize: "2rem",
                fontWeight: "bold",
                borderRadius: "12px",
                textAlign: "center",
                cursor: "pointer",
                userSelect: "none",
                width: "20rem",
                margin: "-10px",
                border:
                  hovered === label ? "4px solid white" : "4px solid #ffffffff",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",

                transform: visibleButtons[i]
                  ? "translateX(0)"
                  : "translateX(-100px)",
                opacity: visibleButtons[i] ? 1 : 0,
                transition:
                  "transform 0.5s ease, opacity 0.5s ease, background 0.3s, color 0.3s, border 0.3s, padding 0.3s",
              }}
            >
              {label}
            </div>
          ))}
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
