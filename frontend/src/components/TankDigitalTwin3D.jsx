import React, { useRef, useEffect, useState } from 'react';
import { Box, Play, Pause, RotateCcw, Layers, ShieldCheck, Thermometer, Gauge, Zap, X, Info } from 'lucide-react';

export default function TankDigitalTwin3D({ isOpen, onClose, currentPressure = 685, temperature = -38 }) {
  const canvasRef = useRef(null);
  const [pressure, setPressure] = useState(currentPressure);
  const [temp, setTemp] = useState(temperature);
  const [flowRate, setFlowRate] = useState(2.4); // kg/min
  const [isRotating, setIsRotating] = useState(true);
  const [explodedView, setExplodedView] = useState(false);
  const [rotation, setRotation] = useState({ x: 0.35, y: -0.6 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Mouse drag orbital rotation controls
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    setRotation((prev) => ({
      x: prev.x + deltaY * 0.008,
      y: prev.y + deltaX * 0.008
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // 3D Rendering Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Generate H2 particles
    const particleCount = 80;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 220,
        y: (Math.random() - 0.5) * 70,
        z: (Math.random() - 0.5) * 70,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 1.5,
        speedZ: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2.5 + 1.2,
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    let localRotY = rotation.y;
    let localRotX = rotation.x;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (isRotating && !isDraggingRef.current) {
        localRotY += 0.008;
      } else {
        localRotY = rotation.y;
        localRotX = rotation.x;
      }

      // 3D Projection math
      const project = (x, y, z) => {
        // Rotate Y
        const cosY = Math.cos(localRotY);
        const sinY = Math.sin(localRotY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Rotate X
        const cosX = Math.cos(localRotX);
        const sinX = Math.sin(localRotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective
        const fov = 420;
        const scale = fov / (fov + z2 + 100);
        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          scale,
          depth: z2
        };
      };

      // Draw Grid Base (Radar Plane)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;
      const gridSize = 160;
      const gridStep = 40;
      for (let gx = -gridSize; gx <= gridSize; gx += gridStep) {
        const p1 = project(gx, 110, -gridSize);
        const p2 = project(gx, 110, gridSize);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
      for (let gz = -gridSize; gz <= gridSize; gz += gridStep) {
        const p1 = project(-gridSize, 110, gz);
        const p2 = project(gridSize, 110, gz);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }

      // Color based on pressure / temp
      const pressureRatio = Math.min(pressure / 700, 1.25);
      const isHighStress = pressure > 700;
      const tankGlow = isHighStress ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.35)';

      // 3D Cylinder Rings (Type IV Carbon Composite Body)
      const ringCount = 14;
      const tankLength = 260;
      const radius = 64;
      const explodeOffset = explodedView ? 40 : 0;

      for (let i = 0; i <= ringCount; i++) {
        const xPos = -tankLength / 2 + (tankLength / ringCount) * i;
        const pts = [];
        const segs = 24;
        for (let s = 0; s < segs; s++) {
          const theta = (s / segs) * Math.PI * 2;
          const yPos = Math.sin(theta) * radius;
          const zPos = Math.cos(theta) * radius;
          pts.push(project(xPos, yPos, zPos));
        }

        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        });
        ctx.closePath();

        // High-tech holographic wireframe
        ctx.strokeStyle = i === 0 || i === ringCount
          ? '#38bdf8'
          : `rgba(6, 182, 212, ${0.15 + (i % 2) * 0.25})`;
        ctx.lineWidth = i === 0 || i === ringCount ? 2.5 : 1.2;
        ctx.stroke();

        // Inner Liner (if exploded view is enabled)
        if (explodedView) {
          const innerPts = [];
          for (let s = 0; s < segs; s++) {
            const theta = (s / segs) * Math.PI * 2;
            const yPos = Math.sin(theta) * (radius * 0.65);
            const zPos = Math.cos(theta) * (radius * 0.65);
            innerPts.push(project(xPos + explodeOffset, yPos, zPos));
          }
          ctx.beginPath();
          innerPts.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          });
          ctx.closePath();
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Longitudinal Ribs (Carbon weave strands)
      const ribCount = 8;
      for (let r = 0; r < ribCount; r++) {
        const theta = (r / ribCount) * Math.PI * 2;
        const yPos = Math.sin(theta) * radius;
        const zPos = Math.cos(theta) * radius;
        const pStart = project(-tankLength / 2, yPos, zPos);
        const pEnd = project(tankLength / 2, yPos, zPos);

        ctx.beginPath();
        ctx.moveTo(pStart.px, pStart.py);
        ctx.lineTo(pEnd.px, pEnd.py);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // End Caps & Valve Boss
      const pLeftCenter = project(-tankLength / 2 - 18, 0, 0);
      const pRightCenter = project(tankLength / 2 + 18, 0, 0);

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(pRightCenter.px, pRightCenter.py, 10 * pRightCenter.scale, 0, Math.PI * 2);
      ctx.fill();

      // Particles (H2 Gas Molecules with Flow Velocity)
      particles.forEach((p) => {
        p.x += p.speedX * (flowRate * 0.7);
        p.y += p.speedY;
        p.z += p.speedZ;

        // Bounce within cylinder boundaries
        if (p.x > tankLength / 2 - 10) p.x = -tankLength / 2 + 10;
        if (p.x < -tankLength / 2 + 10) p.x = tankLength / 2 - 10;
        if (p.y > radius - 8 || p.y < -radius + 8) p.speedY *= -1;
        if (p.z > radius - 8 || p.z < -radius + 8) p.speedZ *= -1;

        const proj = project(p.x, p.y, p.z);
        ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha * (pressureRatio * 0.9)})`;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, p.size * proj.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Hologram Center Ambient Aura
      const centerProj = project(0, 0, 0);
      const grad = ctx.createRadialGradient(
        centerProj.px,
        centerProj.py,
        10,
        centerProj.px,
        centerProj.py,
        160 * centerProj.scale
      );
      grad.addColorStop(0, tankGlow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerProj.px, centerProj.py, 160 * centerProj.scale, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rotation, isRotating, pressure, temp, flowRate, explodedView]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1250, backdropFilter: 'blur(12px)', background: 'rgba(2, 6, 23, 0.88)' }}>
      <div style={{
        background: 'linear-gradient(150deg, #090e1a 0%, #030712 100%)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '920px',
        padding: '32px',
        color: '#ffffff',
        boxShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 60px rgba(6, 182, 212, 0.15)',
        position: 'relative'
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <Box size={24} color="#06b6d4" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Type IV 700-Bar Digital Twin</h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Real-Time 3D Cryogenic & Structural Mechanics Visualizer</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setIsRotating(!isRotating)}
              style={{
                background: isRotating ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#38bdf8',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isRotating ? <Pause size={14} /> : <Play size={14} />}
              <span>{isRotating ? 'Pause Orbit' : 'Auto Orbit'}</span>
            </button>
            <button
              onClick={() => setExplodedView(!explodedView)}
              style={{
                background: explodedView ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layers size={14} />
              <span>Exploded View</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            background: 'radial-gradient(circle at 50% 50%, #0c162d 0%, #030712 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            cursor: 'grab',
            overflow: 'hidden',
            height: '360px',
            marginBottom: '22px',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
          }}
        >
          <canvas
            ref={canvasRef}
            width={850}
            height={360}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Floating Live Telemetry HUD Badges */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '10px', padding: '6px 12px', fontSize: '12px' }}>
              <span style={{ color: '#94a3b8' }}>Core Pressure: </span>
              <strong style={{ color: pressure > 700 ? '#ef4444' : '#22d3ee', fontSize: '14px' }}>{pressure} bar</strong>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '10px', padding: '6px 12px', fontSize: '12px' }}>
              <span style={{ color: '#94a3b8' }}>Cryo Temp: </span>
              <strong style={{ color: '#60a5fa', fontSize: '14px' }}>{temp}°C (SAE J2601)</strong>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: '#64748b' }}>
            🖱️ Click & Drag to Orbit 360°
          </div>
        </div>

        {/* Real-time Interactive Control Sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gauge size={14} color="#06b6d4" /> Pressure
              </span>
              <strong style={{ color: '#06b6d4' }}>{pressure} bar</strong>
            </div>
            <input
              type="range"
              min="50"
              max="875"
              value={pressure}
              onChange={(e) => setPressure(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#06b6d4' }}
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Thermometer size={14} color="#60a5fa" /> Pre-Chill Temp
              </span>
              <strong style={{ color: '#60a5fa' }}>{temp}°C</strong>
            </div>
            <input
              type="range"
              min="-50"
              max="25"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={14} color="#f59e0b" /> Flow Speed
              </span>
              <strong style={{ color: '#f59e0b' }}>{flowRate} kg/min</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={flowRate}
              onChange={(e) => setFlowRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b' }}
            />
          </div>
        </div>

        {/* Structural Specs Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '14px', padding: '12px 18px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ color: '#cbd5e1' }}>
              Type IV High-Molecular Polyamide Liner with Toray T700 Carbon-Fiber Overwrap. Tested to 2.25x Burst Pressure (1,575 bar).
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
