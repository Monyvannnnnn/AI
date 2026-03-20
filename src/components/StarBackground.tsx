import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  twinkleOffset: number;
}

const StarBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const mouseVelocityRef = useRef(0);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const viewport = window.visualViewport;

    const resize = () => {
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    viewport?.addEventListener("resize", resize);

    const getLogicalWidth = () => canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
    const getLogicalHeight = () => canvas.height / (Math.min(window.devicePixelRatio || 1, 2));

    const logicalWidth = getLogicalWidth();
    const logicalHeight = getLogicalHeight();
    const density = isCoarsePointer ? 12000 : 8000;
    const count = Math.floor((logicalWidth * logicalHeight) / density);
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * logicalWidth,
      y: Math.random() * logicalHeight,
      radius: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.55 + 0.3,
      speed: Math.random() * 0.45 + 0.12,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    const handleMouseMove = (event: MouseEvent) => {
      const dx = event.clientX - mouseRef.current.x;
      const dy = event.clientY - mouseRef.current.y;
      mouseVelocityRef.current = Math.min(28, Math.sqrt(dx * dx + dy * dy));
      mouseRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame = 0;
    let frame = 0;
    const connectionDistance = isCoarsePointer ? 0 : 170;
    const mouseRadius = isCoarsePointer ? 0 : 280;

    const draw = () => {
      frame += 1;
      const width = getLogicalWidth();
      const height = getLogicalHeight();
      ctx.clearRect(0, 0, width, height);
      const stars = starsRef.current;
      const mouse = mouseRef.current;
      const styles = getComputedStyle(document.documentElement);
      const starColor = styles.getPropertyValue("--star-rgb").trim() || "120 220 210";
      const lineColor = styles.getPropertyValue("--star-line-rgb").trim() || starColor;
      mouseVelocityRef.current *= 0.92;

      for (const star of stars) {
        star.y += star.speed;
        if (star.y > height + 5) {
          star.y = -5;
          star.x = Math.random() * width;
        }

        const dxMouse = star.x - mouse.x;
        const dyMouse = star.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        const influence = Math.max(0, 1 - distMouse / mouseRadius);
        const twinkle = (Math.sin(frame * 0.03 + star.twinkleOffset) + 1) / 2;
        const glow = influence * (0.28 + mouseVelocityRef.current * 0.012);
        const starOpacity = Math.min(1, star.opacity + twinkle * 0.18 + influence * 0.35);

        if (glow > 0.02) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * (3 + influence * 3.2), 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${lineColor} / ${glow})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${starColor} / ${starOpacity})`;
        ctx.fill();
      }

      if (!isCoarsePointer) {
        for (let i = 0; i < stars.length; i += 1) {
          const dx = stars[i].x - mouse.x;
          const dy = stars[i].y - mouse.y;
          const distMouse = Math.sqrt(dx * dx + dy * dy);
          if (distMouse > mouseRadius) continue;

          for (let j = i + 1; j < stars.length; j += 1) {
            const dx2 = stars[i].x - stars[j].x;
            const dy2 = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist >= connectionDistance) continue;

            const secondDistMouse = Math.sqrt(
              (stars[j].x - mouse.x) * (stars[j].x - mouse.x) +
                (stars[j].y - mouse.y) * (stars[j].y - mouse.y),
            );
            if (secondDistMouse > mouseRadius) continue;

            const alpha =
              (1 - dist / connectionDistance) *
              (0.28 + mouseVelocityRef.current * 0.02) *
              (1 - Math.max(distMouse, secondDistMouse) / mouseRadius);
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgb(${lineColor} / ${alpha})`;
            ctx.lineWidth = 0.8 + mouseVelocityRef.current * 0.03;
            ctx.stroke();
          }
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      viewport?.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
};

export default StarBackground;
