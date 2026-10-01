'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function AnimatedSplashScreen() {
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const emblemRef = useRef<HTMLDivElement>(null);
  const gridHRefs = useRef<(SVGLineElement | null)[]>([]);
  const gridVRefs = useRef<(SVGLineElement | null)[]>([]);
  const cornerRefs = useRef<SVGGElement>(null);
  const gPathRef = useRef<SVGPathElement>(null);
  const nodeRef = useRef<SVGCircleElement>(null);
  const ring1Ref = useRef<SVGCircleElement>(null);
  const ring2Ref = useRef<SVGCircleElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Hide native Capacitor splash smoothly if running on device
    const hideNativeSplash = async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 250 });
      } catch {
        // Web browser environment
      }
    };
    hideNativeSplash();

    // GSAP Master Timeline for Technical Architectural Splash Sequence (~3.2s total)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(containerRef.current, {
            opacity: 0,
            scale: 1.02,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => setIsDismissed(true),
          });
        },
      });
      timelineRef.current = tl;

      // Initial States
      gsap.set(auraRef.current, { scale: 0.5, opacity: 0 });
      gsap.set(emblemRef.current, { scale: 0.9, opacity: 0 });
      gsap.set(gridHRefs.current.filter(Boolean), { scaleX: 0, transformOrigin: 'center center' });
      gsap.set(gridVRefs.current.filter(Boolean), { scaleY: 0, transformOrigin: 'center center' });
      gsap.set(cornerRefs.current, { scale: 0, transformOrigin: '256px 256px', opacity: 0 });
      
      if (gPathRef.current) {
        const pathLength = gPathRef.current.getTotalLength() || 1400;
        gsap.set(gPathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
          opacity: 0,
        });
      }

      gsap.set(nodeRef.current, { scale: 0, transformOrigin: 'center center' });
      gsap.set([ring1Ref.current, ring2Ref.current], { scale: 0, opacity: 0, transformOrigin: 'center center' });
      gsap.set(titleRef.current, { y: 25, opacity: 0, filter: 'blur(8px)' });
      gsap.set(subtitleRef.current, { opacity: 0, letterSpacing: '0.1em' });
      gsap.set(progressBarRef.current, { width: '0%' });

      // Stage 1: Ambient Blueprint Glow & Emblem Slate Fade-in (0.0s - 0.5s)
      tl.to(auraRef.current, {
        scale: 1.15,
        opacity: 0.35,
        duration: 0.8,
        ease: 'power2.out',
      }, 0);

      tl.to(emblemRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
      }, 0.1);

      // Stage 2: Drafting Grid Lines Draw In Sequentially (0.3s - 1.1s)
      tl.to(gridHRefs.current.filter(Boolean), {
        scaleX: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
      }, 0.3);

      tl.to(gridVRefs.current.filter(Boolean), {
        scaleY: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
      }, 0.4);

      // Stage 3: Corner Viewfinder Crop Marks Snap In (0.8s - 1.2s)
      tl.to(cornerRefs.current, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: 'back.out(2)',
      }, 0.8);

      // Stage 4: Geometric "G" Draws Along Laser Path (1.0s - 1.9s)
      tl.to(gPathRef.current, {
        opacity: 1,
        strokeDashoffset: 0,
        duration: 0.95,
        ease: 'power2.inOut',
      }, 0.95);

      // Stage 5: Blueprint Cyan Reticle Center Node Pulses with Radar Waves (1.6s - 2.4s)
      tl.to(nodeRef.current, {
        scale: 1,
        duration: 0.4,
        ease: 'elastic.out(1, 0.4)',
      }, 1.65);

      tl.to(ring1Ref.current, {
        scale: 1,
        opacity: 0.85,
        duration: 0.4,
        ease: 'power2.out',
      }, 1.8);

      tl.to(ring2Ref.current, {
        scale: 1.8,
        opacity: 0.4,
        duration: 0.6,
        ease: 'power1.out',
      }, 1.9);

      // Stage 6: Typography Reveal & Progress Bar Loading (1.8s - 2.8s)
      tl.to(titleRef.current, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.7,
        ease: 'power3.out',
      }, 1.8);

      tl.to(subtitleRef.current, {
        opacity: 1,
        letterSpacing: '0.28em',
        duration: 0.8,
        ease: 'power2.out',
      }, 2.0);

      tl.to(progressBarRef.current, {
        width: '100%',
        duration: 1.0,
        ease: 'power1.inOut',
      }, 1.8);

      // Hold climax briefly before auto exit
      tl.to({}, { duration: 0.35 });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleQuickDismiss = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: () => setIsDismissed(true),
    });
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onClick={handleQuickDismiss}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer bg-[#0B0F14]"
    >
      {/* 1. Ambient Blueprint Radial Aura */}
      <div
        ref={auraRef}
        className="absolute w-[440px] h-[440px] rounded-full bg-[#38bdf8]/15 blur-[100px] pointer-events-none"
      />

      {/* 2. Central Emblem & Animation Stage */}
      <div className="relative flex flex-col items-center justify-center z-10">
        {/* Emblem Slate */}
        <div
          ref={emblemRef}
          className="relative w-[136px] h-[136px] sm:w-[154px] sm:h-[154px] rounded-2xl bg-[#0b0f14] border border-[#273444] shadow-2xl p-2.5 flex items-center justify-center overflow-hidden"
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.1)',
          }}
        >
          {/* Subtle Interior Glow */}
          <div className="absolute inset-0 bg-radial from-[#38bdf8]/10 via-transparent to-transparent pointer-events-none" />

          {/* Precision Architectural SVG Stage */}
          <svg
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full relative z-10"
          >
            {/* Horizontal Grid Lines */}
            <g stroke="#334155" strokeWidth="3" opacity="0.75">
              <line ref={(el) => { gridHRefs.current[0] = el; }} x1="80" y1="120" x2="432" y2="120" />
              <line ref={(el) => { gridHRefs.current[1] = el; }} x1="80" y1="188" x2="432" y2="188" />
              <line ref={(el) => { gridHRefs.current[2] = el; }} x1="80" y1="256" x2="432" y2="256" />
              <line ref={(el) => { gridHRefs.current[3] = el; }} x1="80" y1="324" x2="432" y2="324" />
              <line ref={(el) => { gridHRefs.current[4] = el; }} x1="80" y1="392" x2="432" y2="392" />
            </g>

            {/* Vertical Grid Lines */}
            <g stroke="#334155" strokeWidth="3" opacity="0.75">
              <line ref={(el) => { gridVRefs.current[0] = el; }} x1="120" y1="80" x2="120" y2="432" />
              <line ref={(el) => { gridVRefs.current[1] = el; }} x1="188" y1="80" x2="188" y2="432" />
              <line ref={(el) => { gridVRefs.current[2] = el; }} x1="256" y1="80" x2="256" y2="432" />
              <line ref={(el) => { gridVRefs.current[3] = el; }} x1="324" y1="80" x2="324" y2="432" />
              <line ref={(el) => { gridVRefs.current[4] = el; }} x1="392" y1="80" x2="392" y2="432" />
            </g>

            {/* Corner Viewfinder Crop Marks */}
            <g ref={cornerRefs} stroke="#38bdf8" strokeWidth="3.5" opacity="0.6" strokeLinecap="round">
              <path d="M 68 84 H 84 V 68" fill="none" />
              <path d="M 444 84 H 428 V 68" fill="none" />
              <path d="M 68 428 H 84 V 444" fill="none" />
              <path d="M 444 428 H 428 V 444" fill="none" />
            </g>

            {/* Stylized Geometric "G" Laser Stroke */}
            <path
              ref={gPathRef}
              d="M 372 168 
                 C 344 120, 304 104, 256 104 
                 C 172 104, 112 172, 112 256 
                 C 112 340, 172 408, 256 408 
                 C 336 408, 396 348, 396 268 
                 L 396 256 
                 L 256 256"
              fill="none"
              stroke="#f8fafc"
              strokeWidth="42"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Cyan Reticle Radar Pulse Rings */}
            <circle
              ref={ring2Ref}
              cx="256"
              cy="256"
              r="40"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <circle
              ref={ring1Ref}
              cx="256"
              cy="256"
              r="28"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              strokeDasharray="5 4"
            />

            {/* Center Focal Cyan Reticle Node */}
            <circle ref={nodeRef} cx="256" cy="256" r="16" fill="#38bdf8" />
          </svg>
        </div>

        {/* 3. Typography & Calibration Status */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div
            ref={titleRef}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f8fafc] flex items-center justify-center gap-0.5"
          >
            <span>Grid</span>
            <span className="text-[#38bdf8] drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">
              Sketch
            </span>
          </div>

          <div
            ref={subtitleRef}
            className="mt-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.28em] text-[#94a3b8] uppercase font-mono"
          >
            Precision Drafting Studio
          </div>

          {/* Micro Progress Bar */}
          <div className="mt-6 w-36 h-[2px] bg-[#273444] rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#f8fafc] rounded-full"
            />
          </div>

          <div
            ref={progressTextRef}
            className="mt-2 text-[9px] font-mono tracking-widest text-[#94a3b8]/70 uppercase"
          >
            Studio Calibrated
          </div>
        </div>
      </div>
    </div>
  );
}
