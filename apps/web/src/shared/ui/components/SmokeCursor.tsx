'use client';

import React, { useEffect, useRef } from 'react';

/**
 * SmokeCursor Component
 * 
 * Creates a faint blue smoke trail that follows the user's mouse cursor.
 * Uses HTML5 Canvas for high-performance particle rendering.
 */
export const SmokeCursor = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const lastMouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        
        // Particle Class
        class Particle {
            x: number;
            y: number;
            size: number;
            vx: number;
            vy: number;
            life: number;
            maxLife: number;
            color: string;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 20 + 10; // Large, soft particles
                
                // Random drift
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.5;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                
                this.life = 0;
                this.maxLife = Math.random() * 30 + 30; // Reduced lifespan for performance (was 50-100)
                
                // Faint blue smoke color
                // hsla(210, 100%, 70%, 0.1) -> Light Blue
                this.color = `hsla(210, 80%, 70%, ${Math.random() * 0.05 + 0.02})`;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.size += 0.2; // Smoke expands as it dissipates
                this.life++;
            }

            draw(context: CanvasRenderingContext2D) {
                // Skip drawing if invisible
                if (this.life >= this.maxLife) return;
                
                const opacity = 1 - (this.life / this.maxLife);
                context.globalAlpha = opacity;
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fillStyle = this.color;
                context.fill();
                context.globalAlpha = 1;
            }
        }

        // Resize handler
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
            
            // Spawn particles on movement
            const dist = Math.hypot(
                mouseRef.current.x - lastMouseRef.current.x,
                mouseRef.current.y - lastMouseRef.current.y
            );

            // Increase distance threshold to spawn fewer particles
            if (dist > 5) {
                // Interpolate for smoother trails but with fewer steps
                const steps = Math.min(dist, 3); // Reduced max interpolation steps
                for (let i = 0; i < steps; i++) {
                    const x = lastMouseRef.current.x + (mouseRef.current.x - lastMouseRef.current.x) * (i / steps);
                    const y = lastMouseRef.current.y + (mouseRef.current.y - lastMouseRef.current.y) * (i / steps);
                    
                    // Limit total particles hard cap
                    if (particles.length < 150) {
                        particles.push(new Particle(x, y));
                    }
                }
            }
            lastMouseRef.current = { ...mouseRef.current };
        };

        // Animation Loop
        const animate = () => {
            // Optimization: Skip processing if no particles
            if (particles.length === 0) {
                // Clear the canvas one last time when emptying
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                animationFrameId = requestAnimationFrame(animate);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Filter out dead particles
            particles = particles.filter(p => p.life < p.maxLife);

            // Update and draw
            particles.forEach(p => {
                p.update();
                p.draw(ctx);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Init
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        
        // Initial mouse position
        mouseRef.current = { x: window.innerWidth / 4, y: window.innerHeight / 4 };
        lastMouseRef.current = { ...mouseRef.current };
        
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999, // On top of everything but non-interactive
                mixBlendMode: 'screen', // Blends nicely with dark backgrounds
                // filter: 'blur(8px)', // REMOVED: Expensive blur filter
            }}
        />
    );
};
