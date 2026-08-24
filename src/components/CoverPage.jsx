import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ArrowRight } from 'lucide-react';

export default function CoverPage({ onEnter }) {
  const shaderCanvasRef = useRef(null);
  const threejsContainerRef = useRef(null);

  useEffect(() => {
    // 1. WEBGL SHADER BACKGROUND
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;

    let gl;
    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
      console.error('WebGL not supported');
      return;
    }
    if (!gl) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    syncSize();

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    
    float n1 = snoise(uv * 2.0 + u_time * 0.05);
    float n2 = snoise(uv * 4.0 - u_time * 0.1 + n1);
    
    vec3 color1 = vec3(0.043, 0.075, 0.149); // #0b1326
    vec3 color2 = vec3(0.0, 0.941, 1.0);   // #00f0ff
    vec3 color3 = vec3(0.02, 0.04, 0.08);   // Deeper Blue
    
    float mixFactor = smoothstep(-1.0, 1.0, n2);
    vec3 color = mix(color1, color3, mixFactor);
    
    float edge = smoothstep(0.45, 0.5, abs(n2));
    color = mix(color, color2, edge * 0.15);
    
    float dist = distance(uv, mouse);
    float glow = smoothstep(0.3, 0.0, dist) * 0.2;
    color += color2 * glow;

    gl_FragColor = vec4(color, 1.0);
}`;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animFrameId;
    function render(t) {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animFrameId = requestAnimationFrame(render);
    }
    render(0);

    const resizeObserver = new ResizeObserver(() => {
      syncSize();
    });
    resizeObserver.observe(canvas);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // 2. THREE.JS CORE ANIMATION
    const container = threejsContainerRef.current;
    if (!container) return;

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 800;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const coreGroup = new THREE.Group();
    mainGroup.add(coreGroup);

    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshPhongMaterial({ 
      color: 0x00f0ff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.6,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.5
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(core);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.2 });
    const rings = [];
    for(let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(1.8 + i * 0.4, 0.01, 16, 100);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      coreGroup.add(ring);
      rings.push(ring);
    }

    const particlesCount = 800;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const r = 4 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.03, transparent: true, opacity: 0.4 });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    mainGroup.add(particles);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00f0ff, 1.5, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    camera.position.z = 8;

    let frameId;
    function animate() {
      frameId = requestAnimationFrame(animate);
      coreGroup.rotation.y += 0.005;
      coreGroup.rotation.x += 0.002;
      particles.rotation.y -= 0.001;
      mainGroup.position.y = Math.sin(Date.now() * 0.001) * 0.2;
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 800;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] overflow-hidden w-screen h-screen relative antialiased selection:bg-[#00f0ff] selection:text-[#004f54]">
      {/* Background Shader */}
      <div className="absolute inset-0 w-full h-full -z-20 opacity-50">
        <canvas ref={shaderCanvasRef} className="block w-full h-full"></canvas>
      </div>

      {/* Header Logo */}
      <header className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center mix-blend-screen">
        <div className="text-2xl font-bold text-[#00f0ff] tracking-tight glitch-flicker">
          CyberRiskIQ
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">
        {/* ThreeJS Container */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 opacity-70 mix-blend-screen">
          <div ref={threejsContainerRef} className="w-[800px] h-[800px]"></div>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl text-center space-y-6 z-20 backdrop-blur-md bg-[#060e20]/30 p-12 rounded-xl border border-[#3b494b]/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#dae2fd] leading-tight glitch-flicker">
            Quantifying Digital Risk with Precision
          </h1>
          <p className="text-sm md:text-base text-[#b9cacb] max-w-2xl mx-auto glitch-flicker">
            Protect your enterprise with real-time financial risk modeling and budget optimization.
          </p>
          <div className="pt-4 glitch-flicker">
            <button
              onClick={onEnter}
              className="glow-btn group relative inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#171f33]/50 backdrop-blur-sm border border-[#00f0ff]/50 text-[#00f0ff] text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#00f0ff]/10 overflow-hidden rounded cursor-pointer"
            >
              <span className="relative z-10">Enter Platform</span>
              <ArrowRight className="w-4 h-4 relative z-10 transform transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-[#00f0ff]/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="absolute bottom-0 left-0 w-full p-6 z-20 flex justify-center pb-8 pointer-events-none mix-blend-screen">
        <div className="text-[12px] font-mono text-[#00dbe9]/80 flex items-center gap-2 glitch-flicker">
          <span className="w-2.5 h-2.5 bg-[#2ff801] rounded-full animate-pulse shadow-[0_0_8px_rgba(47,248,1,0.8)]"></span>
          System Active | Monitoring 450+ Global Threat Vectors
        </div>
      </footer>
    </div>
  );
}
