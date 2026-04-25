import { useEffect, useRef } from "react";

const riskStreams = [
    { rowRatio: 0.18, startCol: -14, length: 10, speed: 0.05, color: "#EF5B3E", intensity: 0.9, labelOffset: -2 },
    { rowRatio: 0.34, startCol: -2, length: 12, speed: 0.04, color: "#FF7A59", intensity: 0.82, labelOffset: -1 },
    { rowRatio: 0.58, startCol: -20, length: 9, speed: 0.06, color: "#F97316", intensity: 0.8, labelOffset: 1 },
    { rowRatio: 0.8, startCol: -8, length: 11, speed: 0.045, color: "#FF8B61", intensity: 0.86, labelOffset: 0 },
];

const secureStreams = [
    { rowRatio: 0.1, startCol: -6, length: 14, speed: 0.055, color: "#A3E36B", intensity: 0.82 },
    { rowRatio: 0.27, startCol: -18, length: 15, speed: 0.05, color: "#9BE564", intensity: 0.8 },
    { rowRatio: 0.47, startCol: -10, length: 13, speed: 0.052, color: "#A8F06F", intensity: 0.84 },
    { rowRatio: 0.68, startCol: -24, length: 14, speed: 0.047, color: "#96DB60", intensity: 0.8 },
    { rowRatio: 0.9, startCol: -14, length: 12, speed: 0.058, color: "#A3E36B", intensity: 0.85 },
];

function HeroGrid({ fullBleed = false, className = "" }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId;
        let time = 0;

        const dotSize = 4;
        const gap = 15;
        const paddingX = 18;
        const paddingY = 18;

        const resize = () => {
            const ratio = window.devicePixelRatio || 1;
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        };

        const drawLabel = (x, y, text, color) => {
            ctx.save();
            ctx.font = "600 11px Inter, ui-sans-serif, system-ui, sans-serif";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(235, 235, 235, 0.42)";
            ctx.fillText(text, x, y);
            ctx.fillStyle = color;
            ctx.fillRect(x + ctx.measureText(text).width + 9, y - 1, 4, 4);
            ctx.restore();
        };

        const wrapProgress = (value, range) => {
            const wrapped = value % range;
            return wrapped < 0 ? wrapped + range : wrapped;
        };

        const resolveRow = (stream, rows) => Math.max(1, Math.min(rows - 2, Math.round(stream.rowRatio * rows)));

        const getStreamInfluence = (row, col, stream, cols, rows) => {
            const travelRange = cols + stream.length + 8;
            const head = wrapProgress(stream.startCol + time * 60 * stream.speed, travelRange) - stream.length;
            const tail = head + stream.length;
            const streamRow = resolveRow(stream, rows);

            if (row !== streamRow || col < head || col > tail) {
                return null;
            }

            const progress = (col - head) / stream.length;
            const core = Math.sin(progress * Math.PI);
            const shimmer = 0.8 + Math.sin(time * 4 + col * 0.2) * 0.2;

            return {
                alpha: Math.max(0, core * stream.intensity * shimmer),
                color: stream.color,
                head,
                tail,
            };
        };

        const draw = () => {
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;
            const cols = Math.ceil((width - paddingX * 2) / gap) + 2;
            const rows = Math.ceil((height - paddingY * 2) / gap) + 2;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#050505";
            ctx.fillRect(0, 0, width, height);

            time += 0.015;
            const startX = paddingX;
            const startY = paddingY;

            for (let row = 0; row < rows; row += 1) {
                for (let col = 0; col < cols; col += 1) {
                    const x = startX + col * gap;
                    const y = startY + row * gap;

                    let fill = "rgba(120, 120, 126, 0.46)";
                    let alpha = 0.5 + Math.sin(time * 0.7 + row * 0.22 + col * 0.04) * 0.04;
                    let size = dotSize;

                    riskStreams.forEach((stream) => {
                        const influence = getStreamInfluence(row, col, stream, cols, rows);
                        if (influence) {
                            alpha = Math.max(alpha, influence.alpha);
                            fill = influence.color;
                            size = dotSize + influence.alpha * 0.8;
                        }
                    });

                    secureStreams.forEach((stream) => {
                        const influence = getStreamInfluence(row, col, stream, cols, rows);
                        if (influence) {
                            alpha = Math.max(alpha, influence.alpha);
                            fill = influence.color;
                            size = dotSize + influence.alpha * 0.65;
                        }
                    });

                    ctx.save();
                    ctx.globalAlpha = Math.max(0.18, Math.min(alpha, 0.98));
                    ctx.fillStyle = fill;
                    ctx.fillRect(x, y, size, size);
                    ctx.restore();
                }
            }

            const labels = riskStreams.map((stream) => {
                const travelRange = cols + stream.length + 8;
                const head = wrapProgress(stream.startCol + time * 60 * stream.speed, travelRange) - stream.length;
                const labelCol = Math.max(1, Math.min(cols - 12, head + Math.max(1, stream.length * 0.2)));
                const row = Math.max(1, Math.min(rows - 2, resolveRow(stream, rows) + stream.labelOffset));

                return {
                    row,
                    col: labelCol,
                    color: stream.color,
                };
            });

            labels.forEach((label) => {
                const x = startX + label.col * gap;
                const y = startY + label.row * gap;
                drawLabel(x, y, "Risk detected", label.color);
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener("resize", resize);
        resize();
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const containerClasses = fullBleed
        ? `absolute inset-0 overflow-hidden bg-[#050505] ${className}`.trim()
        : `relative h-[470px] w-full overflow-hidden rounded-[28px] border border-white/6 bg-[#050505] shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${className}`.trim();

    return (
        <div className={containerClasses}>
            <canvas
                ref={canvasRef}
                className="h-full w-full"
                style={{ width: "100%", height: "100%" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.06)_38%,rgba(0,0,0,0.12)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_65%_55%,rgba(154,255,110,0.06),transparent_22%),radial-gradient(circle_at_54%_34%,rgba(255,122,89,0.06),transparent_24%),radial-gradient(circle_at_27%_68%,rgba(255,91,62,0.045),transparent_20%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
        </div>
    );
}

export default HeroGrid;
