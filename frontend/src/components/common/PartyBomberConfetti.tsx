import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle' | 'star' | 'ribbon';
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  decay: number;
}

interface PartyBomberConfettiProps {
  durationMs?: number;
  onComplete?: () => void;
  triggerKey?: string | number;
  playSound?: boolean;
}

const CELEBRATION_COLORS = [
  '#F59E0B', // Amber Gold
  '#10B981', // Emerald Green
  '#3B82F6', // Royal Blue
  '#EC4899', // Hot Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#FFD700', // Bright Gold
  '#F97316', // Orange
];

export const PartyBomberConfetti: React.FC<PartyBomberConfettiProps> = ({
  durationMs = 4500,
  onComplete,
  triggerKey = 0,
  playSound = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to window dimensions with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Play subtle synthesized celebratory fanfare chime using Web Audio API
    if (playSound) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }

          const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 fanfare
          notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.1);

            gain.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + index * 0.1 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.1 + 0.35);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(audioCtx.currentTime + index * 0.1);
            osc.stop(audioCtx.currentTime + index * 0.1 + 0.38);
          });
        }
      } catch {
        // Ignore audio block
      }
    }

    const particles: Particle[] = [];
    const shapes: Particle['shape'][] = ['rect', 'circle', 'star', 'ribbon'];

    // Function to shoot a blast of confetti from specified coordinates and angle
    const spawnCannonBlast = (
      originX: number,
      originY: number,
      baseAngleDeg: number,
      spreadDeg: number,
      count: number,
      speedMultiplier: number
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = ((baseAngleDeg + (Math.random() - 0.5) * spreadDeg) * Math.PI) / 180;
        const speed = (Math.random() * 18 + 14) * speedMultiplier;
        const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 8 + 6,
          color,
          shape,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          wobble: Math.random() * 10,
          wobbleSpeed: Math.random() * 0.1 + 0.05,
          opacity: 1,
          decay: Math.random() * 0.005 + 0.004,
        });
      }
    };

    // Cannon 1: Bottom-Left Party Bomber (blasts upwards and to the right)
    spawnCannonBlast(width * 0.08, height * 0.95, -60, 50, 75, 1.15);

    // Cannon 2: Bottom-Right Party Bomber (blasts upwards and to the left)
    spawnCannonBlast(width * 0.92, height * 0.95, -120, 50, 75, 1.15);

    // Cannon 3: Central Aerial Burst (shoots all around from upper center)
    spawnCannonBlast(width * 0.5, height * 0.45, -90, 140, 90, 0.9);

    // Delayed secondary burst for continuous celebration effect
    const timeout1 = setTimeout(() => {
      spawnCannonBlast(width * 0.2, height * 0.88, -70, 45, 50, 1.05);
      spawnCannonBlast(width * 0.8, height * 0.88, -110, 45, 50, 1.05);
    }, 400);

    const timeout2 = setTimeout(() => {
      spawnCannonBlast(width * 0.5, height * 0.4, -90, 180, 60, 0.85);
    }, 900);

    const startTime = performance.now();

    // Render loop
    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply physics
        p.vx *= 0.985; // Air resistance
        p.vy += 0.32;  // Gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > height + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        const wobbleScale = Math.cos(p.wobble);

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          // Draw 5-pointed star
          ctx.beginPath();
          const spikes = 5;
          const outerRadius = p.size;
          const innerRadius = p.size / 2;
          let rot = (Math.PI / 2) * 3;
          const step = Math.PI / spikes;

          ctx.moveTo(0, -outerRadius);
          for (let s = 0; s < spikes; s++) {
            ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
            rot += step;
          }
          ctx.lineTo(0, -outerRadius);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'ribbon') {
          // Curved ribbon strip
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.quadraticCurveTo(0, wobbleScale * 8, p.size, 0);
          ctx.stroke();
        } else {
          // Rectangular paper strip tumbling
          ctx.scale(1, wobbleScale);
          ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.8);
        }

        ctx.restore();
      }

      if (elapsed < durationMs && particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      ctx.clearRect(0, 0, width, height);
    };
  }, [triggerKey, durationMs, onComplete, playSound]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex flex-col justify-between">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Visual Corner Party Popper Cannons */}
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 flex flex-col items-center pointer-events-none animate-bounce">
        <span className="text-4xl sm:text-5xl drop-shadow-lg transform -rotate-45 select-none">
          🎉
        </span>
        <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs mt-1">
          POPPED!
        </span>
      </div>

      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 flex flex-col items-center pointer-events-none animate-bounce">
        <span className="text-4xl sm:text-5xl drop-shadow-lg transform rotate-45 select-none">
          🎉
        </span>
        <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs mt-1">
          POPPED!
        </span>
      </div>

      {/* Floating Celebration Banner */}
      <div className="w-full flex justify-center pt-8 pointer-events-none animate-in fade-in slide-in-from-top-6 duration-700">
        <div className="px-6 py-2.5 rounded-full bg-linear-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-2xl flex items-center gap-2.5 border-2 border-white/40 backdrop-blur-md">
          <span className="text-xl">🎊</span>
          <span>FEE PAYMENT COMPLETED SUCCESSFULLY!</span>
          <span className="text-xl">🥳</span>
        </div>
      </div>
    </div>
  );
};

