// WebGL chromatic-wave shader — tinted to the CrawlPay purple palette.
// Renders into a canvas that fills its parent. Each instance owns its own scene/renderer.
function WebGLShader({ className = '', style }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof THREE === 'undefined') return;

    const parent = canvas.parentElement;

    const vertexShader = `
      attribute vec3 position;
      void main() { gl_Position = vec4(position, 1.0); }
    `;

    // Tinted toward our accent purple (#7b6ef6 / #9d8fff). Reduced intensity
    // so it acts as ambient backdrop, not a foreground element.
    const fragmentShader = `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float intensity;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        // Subtle chromatic split kept for organic motion, but tiny
        float dx = 0.012;
        float sa = sin((p.x - dx + time) * xScale) * yScale;
        float sb = sin((p.x      + time) * xScale) * yScale;
        float sc = sin((p.x + dx + time) * xScale) * yScale;

        float a = intensity / abs(p.y + sa);
        float b = intensity / abs(p.y + sb);
        float c = intensity / abs(p.y + sc);

        // Collapse to a single streak intensity
        float streak = (a + b + c) / 3.0;
        streak = clamp(streak, 0.0, 1.4);

        // Map streak onto a deep-violet → bright-lavender ramp (palette aware)
        vec3 col = mix(
          vec3(0.06, 0.04, 0.16),   // deep night
          vec3(0.61, 0.56, 1.00),   // accent-bright #9d8fff
          smoothstep(0.0, 1.0, streak)
        );

        // Slight extra purple tint on the brightest crests
        col += vec3(0.05, 0.02, 0.12) * pow(streak, 2.0);

        // Radial vignette so edges feather into the dark bg
        float vig = smoothstep(1.5, 0.25, length(p));
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const scene    = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(0x0e0e18), 1);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

    const uniforms = {
      resolution: { value: [1, 1] },
      time:       { value: 0 },
      xScale:     { value: 1.2 },
      yScale:     { value: 0.55 },
      intensity:  { value: 0.022 },
    };

    const verts = new Float32Array([
      -1, -1, 0,  1, -1, 0,  -1, 1, 0,
       1, -1, 0, -1,  1, 0,   1, 1, 0,
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));

    const material = new THREE.RawShaderMaterial({
      vertexShader,
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
      uniforms.resolution.value = [w * renderer.getPixelRatio(), h * renderer.getPixelRatio()];
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (parent) ro.observe(parent);
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      uniforms.time.value += dt * 0.55; // slow + dreamy
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={style} />;
}

Object.assign(window, { WebGLShader });
