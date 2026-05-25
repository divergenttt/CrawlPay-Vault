"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CSSProperties } from "react";

type WebGLShaderProps = {
  className?: string;
  style?: CSSProperties;
};

export default function WebGLShader({
  className = "",
  style,
}: WebGLShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;

    const fragmentShader = `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;
      uniform float intensity;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        float d = length(p) * distortion;
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = intensity / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = intensity / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = intensity / abs(p.y + sin((bx + time) * xScale) * yScale);

        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

    const uniforms = {
      resolution: { value: [1, 1] as [number, number] },
      time: { value: 0 },
      xScale: { value: 1.0 },
      yScale: { value: 0.5 },
      distortion: { value: 0.05 },
      intensity: { value: 0.05 },
    };

    const verts = new Float32Array([
      -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0,
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(verts, 3)
    );

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      uniforms.resolution.value = [
        w * renderer.getPixelRatio(),
        h * renderer.getPixelRatio(),
      ];
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (parent) ro.observe(parent);
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      uniforms.time.value += dt * 1.0;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={style} />;
}
