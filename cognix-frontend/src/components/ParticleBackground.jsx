import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let width;
    let height;
    let tick = 0;
    const blobs = [
      { x: 0.1, y: 0.18, r: 0.44, hue: 18, speed: 0.00048 },
      { x: 0.82, y: 0.12, r: 0.3, hue: 24, speed: 0.00058 },
      { x: 0.66, y: 0.78, r: 0.34, hue: 8, speed: 0.00038 },
      { x: 0.34, y: 0.64, r: 0.28, hue: 34, speed: 0.00044 },
    ];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      tick += 1;

      const step = 52;
      for (let row = 0; row <= Math.ceil(height / step); row += 1) {
        for (let col = 0; col <= Math.ceil(width / step); col += 1) {
          const x = col * step;
          const y = row * step;
          const weight = Math.sin(tick * 0.01 + col * 0.36 + row * 0.24) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 0.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,138,61,${0.02 + weight * 0.045})`;
          ctx.fill();
        }
      }

      blobs.forEach((blob) => {
        const cx = (blob.x + Math.sin(tick * blob.speed) * 0.07) * width;
        const cy = (blob.y + Math.cos(tick * blob.speed * 1.3) * 0.06) * height;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, blob.r * Math.max(width, height));
        const hue = blob.hue + Math.sin(tick * 0.0008) * 12;
        gradient.addColorStop(0, `hsla(${hue}, 92%, 56%, 0.06)`);
        gradient.addColorStop(0.5, `hsla(${hue + 10}, 82%, 44%, 0.022)`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      });

      for (let y = 0; y < height; y += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.018)";
        ctx.fillRect(0, y, width, 1);
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        background: "#070304",
      }}
    />
  );
}
