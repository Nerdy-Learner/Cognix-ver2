import { useEffect, useRef } from "react";

const NUM_NODES = 130;
const ROT_SPEED_Y = 0.0035;
const ROT_SPEED_X = 0.0008;

export default function NeuralSphere({ size = 420 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const nodes = [];
    const golden = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < NUM_NODES; i += 1) {
      const theta = (2 * Math.PI * i) / golden;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NUM_NODES);
      nodes.push({
        ox: Math.sin(phi) * Math.cos(theta),
        oy: Math.sin(phi) * Math.sin(theta),
        oz: Math.cos(phi),
        active: Math.random() < 0.16,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let rotY = 0;
    let rotX = 0.28;
    let tick = 0;
    let animId;
    const cx = size / 2;
    const cy = size / 2;
    const scale = cx * 0.84;

    function project(node) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = node.ox * cosY - node.oz * sinY;
      const z1 = node.ox * sinY + node.oz * cosY;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = node.oy * cosX - z1 * sinX;
      const z2 = node.oy * sinX + z1 * cosX;
      const fov = 3;
      const depthScale = fov / (fov + z2 * 0.6);
      const depth = (z2 + 1) / 2;
      return {
        sx: cx + x1 * scale * depthScale,
        sy: cy + y2 * scale * depthScale,
        depth,
        size: 1.2 + depth * 2.8,
        alpha: 0.15 + depth * 0.85,
        active: node.active,
        pulse: node.pulseOffset,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      tick += 1;

      const projected = nodes.map(project);
      const maxLineDist = size * 0.24;

      for (let i = 0; i < projected.length; i += 1) {
        const a = projected[i];
        for (let j = i + 1; j < projected.length; j += 1) {
          const b = projected[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxLineDist) {
            const avg = (a.depth + b.depth) / 2;
            const lineAlpha = (1 - dist / maxLineDist) * avg * 0.24;
            const isActive = a.active || b.active;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.strokeStyle = isActive
              ? `rgba(255, 190, 128, ${lineAlpha * 2.3})`
              : `rgba(255, 106, 42, ${lineAlpha})`;
            ctx.lineWidth = isActive ? 0.9 : 0.45;
            ctx.stroke();
          }
        }
      }

      const sorted = [...projected.keys()].sort((a, b) => projected[a].depth - projected[b].depth);

      sorted.forEach((idx) => {
        const point = projected[idx];
        const radius = point.size;
        const alpha = point.alpha;
        const pulseFactor = point.active ? 1 + Math.sin(tick * 0.05 + point.pulse) * 0.4 : 1;

        if (point.active) {
          const gradient = ctx.createRadialGradient(point.sx, point.sy, 0, point.sx, point.sy, radius * 5 * pulseFactor);
          gradient.addColorStop(0, `rgba(255, 230, 196, ${alpha * 0.95})`);
          gradient.addColorStop(0.3, `rgba(255, 138, 61, ${alpha * 0.55})`);
          gradient.addColorStop(1, "rgba(255, 106, 42, 0)");
          ctx.beginPath();
          ctx.arc(point.sx, point.sy, radius * 5 * pulseFactor, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(point.sx, point.sy, radius * 1.55, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 249, 240, ${alpha})`;
          ctx.fill();
        } else {
          const gradient = ctx.createRadialGradient(point.sx, point.sy, 0, point.sx, point.sy, radius * 2.2);
          gradient.addColorStop(0, `rgba(255, 208, 166, ${alpha * 0.8})`);
          gradient.addColorStop(1, "rgba(255, 106, 42, 0)");
          ctx.beginPath();
          ctx.arc(point.sx, point.sy, radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(point.sx, point.sy, radius * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 239, 224, ${alpha * 0.92})`;
          ctx.fill();
        }
      });

      rotY += ROT_SPEED_Y;
      rotX += ROT_SPEED_X * 0.4;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 0 46px rgba(255,106,42,0.18))",
      }}
    />
  );
}
