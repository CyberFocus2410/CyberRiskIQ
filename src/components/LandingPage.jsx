import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  ArrowRight, 
  PlayCircle, 
  Shield, 
  TrendingUp, 
  LineChart, 
  Landmark, 
  Radio 
} from 'lucide-react';

export default function LandingPage({ onEnter }) {
  const shaderCanvasRef = useRef(null);
  const threejsContainerRef = useRef(null);

  // Intersection Observer for scroll animations
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedEls = document.querySelectorAll('.fade-in-up');
    animatedEls.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Sandbox Calculator State
  const [endpoints, setEndpoints] = useState(5000);
  const [industry, setIndustry] = useState('med');
  const [maturity, setMaturity] = useState('managed');

  // Dynamic ALE calculation
  const calculatedALE = useMemo(() => {
    let industryFactor = 1.0;
    if (industry === 'high') industryFactor = 1.5;
    else if (industry === 'low') industryFactor = 0.5;

    let maturityFactor = 1.0;
    if (maturity === 'basic') maturityFactor = 1.5;
    else if (maturity === 'opt') maturityFactor = 0.4;

    const baseLoss = endpoints * 480 * industryFactor * maturityFactor;
    if (baseLoss >= 1000000) {
      return `$${(baseLoss / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(baseLoss / 1000).toLocaleString()}k`;
  }, [endpoints, industry, maturity]);

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
    <div className="bg-[#0b1326] text-[#dae2fd] font-sans min-h-screen flex flex-col antialiased selection:bg-[#00f0ff] selection:text-[#004f54] overflow-x-hidden relative">
      {/* Global Shader Background */}
      <div className="fixed inset-0 z-[-1] opacity-25 pointer-events-none">
        <canvas ref={shaderCanvasRef} className="block w-full h-full"></canvas>
      </div>

      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-3 bg-[#0b1326]/80 backdrop-blur-xl border-b border-[#3b494b]/20">
        <div className="flex items-center gap-8">
          <a className="text-xl md:text-2xl font-bold text-[#00f0ff] tracking-tight" href="#">
            CyberRiskIQ
          </a>
          <div className="hidden md:flex items-center gap-6 ml-8">
            <a className="text-[#b9cacb] hover:text-[#00f0ff] transition-colors text-sm font-semibold" href="#">Platform</a>
            <a className="text-[#b9cacb] hover:text-[#00f0ff] transition-colors text-sm font-semibold" href="#">Analysis Engine</a>
            <a className="text-[#b9cacb] hover:text-[#00f0ff] transition-colors text-sm font-semibold" href="#">Risk Methodology</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onEnter} className="hidden md:inline-flex text-[#b9cacb] hover:text-[#00f0ff] transition-colors text-sm font-semibold px-4 py-2 cursor-pointer">
            Login
          </button>
          <button onClick={onEnter} className="bg-[#00f0ff] text-[#00363a] text-sm font-bold px-6 py-2 rounded scale-95 transition-all duration-200 hover:bg-[#00f0ff]/95 hover:shadow-[0_0_15px_rgba(0,219,233,0.3)] cursor-pointer">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden fade-in-up">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b1326]/20 via-[#0b1326]/60 to-[#0b1326] pointer-events-none"></div>
        <div className="container mx-auto px-8 max-w-7xl relative z-10 grid md:grid-cols-2 gap-12 items-center">
          
          {/* Content Left */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10">
              <Shield className="text-[#00f0ff] w-4 h-4" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#00f0ff] uppercase">Enterprise Security Intelligence</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight text-[#dae2fd]">
              Quantify Your <br />
              <span className="gradient-text">Digital Risk.</span>
            </h1>
            <p className="text-base text-[#b9cacb] max-w-xl">
              CyberRiskIQ analyzes your infrastructure to predict potential financial loss and optimize security spend. Command your cybersecurity posture with high-fidelity, real-time analytics.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <button onClick={onEnter} className="bg-[#00f0ff] text-[#00363a] font-bold px-8 py-3 rounded border border-[#00f0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all duration-300 flex items-center gap-2 cursor-pointer">
                Start Analysis
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={onEnter} className="bg-[#131b2e] text-[#dae2fd] border border-[#3b494b] hover:border-[#00f0ff]/50 px-8 py-3 rounded transition-all duration-300 flex items-center gap-2 glow-hover cursor-pointer">
                View Demo
                <PlayCircle className="w-4 h-4 text-[#b9cacb]" />
              </button>
            </div>
          </div>

          {/* 3D Visualization Right */}
          <div className="relative h-[400px] md:h-[600px] flex justify-center items-center">
            <div className="absolute inset-0 w-full h-full object-contain scale-75">
              <div ref={threejsContainerRef} className="w-full h-full"></div>
            </div>
            {/* Decorative scanning line effect overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden opacity-20">
              <div className="w-full h-2 bg-[#00f0ff] blur-sm absolute top-0 left-0 animate-[scan_3s_ease-in-out_infinite]"></div>
            </div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative z-10 bg-transparent fade-in-up">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-3xl font-extrabold mb-4 text-[#dae2fd]">Core Capabilities</h2>
            <p className="text-sm text-[#b9cacb] max-w-2xl mx-auto">Transform qualitative threats into quantitative financial metrics. Build resilience through data-driven precision.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="glass-card rounded-lg p-6 flex flex-col h-full glow-hover transition-all duration-300 fade-in-up delay-100">
              <div className="mb-6 flex justify-between items-start">
                <div className="w-12 h-12 rounded bg-[#2d3449] flex items-center justify-center border border-[#3b494b]/30 text-[#00f0ff]">
                  <LineChart className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-[#b9cacb] bg-[#131b2e] px-2 py-1 rounded border border-[#3b494b]/20">MODULE_01</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#dae2fd]">Predictive Analytics</h3>
              <p className="text-sm text-[#b9cacb] mb-6 flex-grow">Forecast potential financial exposure based on real-time threat intelligence and infrastructure vulnerabilities.</p>
              
              {/* Mock Chart Viz */}
              <div className="h-32 bg-[#131b2e] rounded border border-[#3b494b]/30 p-4 relative overflow-hidden flex items-end gap-2 group">
                <div className="w-full bg-[#2d3449] rounded-t h-[40%] transition-all group-hover:bg-[#ffb4ab]/20 border-t border-transparent group-hover:border-[#ffb4ab]/50"></div>
                <div className="w-full bg-[#2d3449] rounded-t h-[60%] transition-all group-hover:bg-[#ffb77f]/20 border-t border-transparent group-hover:border-[#ffb77f]/50"></div>
                <div className="w-full bg-[#2d3449] rounded-t h-[30%] transition-all group-hover:bg-[#00f0ff]/20 border-t border-transparent group-hover:border-[#00f0ff]/50"></div>
                <div className="w-full bg-[#00f0ff]/20 rounded-t h-[80%] border-t border-[#00f0ff] relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">$4.2M</div>
                </div>
                <div className="w-full bg-[#2d3449] rounded-t h-[50%] transition-all group-hover:bg-[#00f0ff]/10 border-t border-transparent group-hover:border-[#00f0ff]/30"></div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card rounded-lg p-6 flex flex-col h-full glow-hover transition-all duration-300 fade-in-up delay-200">
              <div className="mb-6 flex justify-between items-start">
                <div className="w-12 h-12 rounded bg-[#2d3449] flex items-center justify-center border border-[#3b494b]/30 text-[#ffb77f]">
                  <Landmark className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-[#b9cacb] bg-[#131b2e] px-2 py-1 rounded border border-[#3b494b]/20">MODULE_02</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#dae2fd]">Budget Optimization</h3>
              <p className="text-sm text-[#b9cacb] mb-6 flex-grow">Allocate security resources precisely where they mitigate the most financial risk across your enterprise.</p>
              
              {/* Mock Allocation Viz */}
              <div className="h-32 bg-[#131b2e] rounded border border-[#3b494b]/30 p-4 flex flex-col justify-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 font-mono text-[10px] text-[#b9cacb]">Cloud</div>
                  <div className="flex-grow h-2 bg-[#2d3449] rounded overflow-hidden">
                    <div className="h-full bg-[#ffb77f] w-[65%] rounded shadow-[0_0_5px_rgba(255,183,127,0.5)]"></div>
                  </div>
                  <div className="font-mono text-[10px] text-[#ffb77f]">65%</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 font-mono text-[10px] text-[#b9cacb]">Net</div>
                  <div className="flex-grow h-2 bg-[#2d3449] rounded overflow-hidden">
                    <div className="h-full bg-[#00f0ff] w-[25%] rounded shadow-[0_0_5px_rgba(0,240,255,0.5)]"></div>
                  </div>
                  <div className="font-mono text-[10px] text-[#00f0ff]">25%</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 font-mono text-[10px] text-[#b9cacb]">End</div>
                  <div className="flex-grow h-2 bg-[#2d3449] rounded overflow-hidden">
                    <div className="h-full bg-[#849495] w-[10%] rounded"></div>
                  </div>
                  <div className="font-mono text-[10px] text-[#b9cacb]">10%</div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-card rounded-lg p-6 flex flex-col h-full glow-hover transition-all duration-300 fade-in-up delay-300">
              <div className="mb-6 flex justify-between items-start">
                <div className="w-12 h-12 rounded bg-[#2d3449] flex items-center justify-center border border-[#3b494b]/30 text-[#2ae500]">
                  <Radio className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-[#b9cacb] bg-[#131b2e] px-2 py-1 rounded border border-[#3b494b]/20">MODULE_03</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#dae2fd]">Real-time Auditing</h3>
              <p className="text-sm text-[#b9cacb] mb-6 flex-grow">Continuous posture assessment against industry frameworks (NIST, CIS) with live compliance scoring.</p>
              
              {/* Live Pulse Viz */}
              <div className="h-32 bg-[#131b2e] rounded border border-[#3b494b]/30 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-1 opacity-10">
                  <div className="border border-[#3b494b]/50 rounded-sm"></div>
                  <div className="border border-[#3b494b]/50 rounded-sm"></div>
                  <div className="border border-[#3b494b]/50 rounded-sm"></div>
                  <div className="border border-[#3b494b]/50 rounded-sm"></div>
                  <div className="border border-[#3b494b]/50 rounded-sm"></div>
                  <div className="border border-[#3b494b]/50 rounded-sm"></div>
                </div>
                <div className="flex items-center gap-4 z-10 bg-[#2d3449]/80 backdrop-blur-sm px-6 py-3 rounded border border-[#3b494b]/50 shadow-lg">
                  <div className="pulse-indicator"></div>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-[#2ae500] font-bold leading-tight">STATUS SECURE</span>
                    <span className="font-mono text-[9px] text-[#b9cacb]">Last scan: just now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Risk Calculator Preview */}
      <section className="py-20 relative z-10 bg-transparent fade-in-up">
        <div className="container mx-auto px-8 max-w-7xl fade-in-up">
          <div className="glass-card rounded-xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl font-extrabold mb-4 text-[#dae2fd]">Interactive Risk Sandbox</h2>
                <p className="text-sm text-[#b9cacb] mb-8">Estimate your baseline exposure before connecting infrastructure. Adjust parameters to model financial impact scenarios.</p>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-mono font-bold tracking-wider text-[#b9cacb] uppercase">Enterprise Size (Endpoints)</label>
                      <span className="font-mono text-sm text-[#00f0ff] font-bold">{endpoints.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="25000" 
                      value={endpoints}
                      onChange={(e) => setEndpoints(Number(e.target.value))}
                      className="w-full h-2 bg-[#2d3449] rounded-lg appearance-none cursor-pointer accent-[#00f0ff] focus:outline-none shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                    />
                    <div className="flex justify-between mt-1 font-mono text-[9px] text-[#849495]">
                      <span>100</span>
                      <span>25k+</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#131b2e] border border-[#3b494b]/30 rounded p-4">
                      <span className="text-[9px] font-mono font-bold tracking-wider text-[#b9cacb] uppercase block mb-1">Industry Multiplier</span>
                      <select 
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="bg-transparent text-[#dae2fd] w-full focus:outline-none border-b border-[#3b494b]/50 focus:border-[#00f0ff] pb-1 text-xs appearance-none cursor-pointer"
                      >
                        <option value="high" className="bg-[#131b2e]">Finance (High)</option>
                        <option value="med" className="bg-[#131b2e]">Healthcare (Med)</option>
                        <option value="low" className="bg-[#131b2e]">Retail (Low)</option>
                      </select>
                    </div>

                    <div className="bg-[#131b2e] border border-[#3b494b]/30 rounded p-4">
                      <span className="text-[9px] font-mono font-bold tracking-wider text-[#b9cacb] uppercase block mb-1">Current Maturity</span>
                      <select 
                        value={maturity}
                        onChange={(e) => setMaturity(e.target.value)}
                        className="bg-transparent text-[#dae2fd] w-full focus:outline-none border-b border-[#3b494b]/50 focus:border-[#00f0ff] pb-1 text-xs appearance-none cursor-pointer"
                      >
                        <option value="basic" className="bg-[#131b2e]">Basic (Ad-hoc)</option>
                        <option value="managed" className="bg-[#131b2e]">Managed</option>
                        <option value="opt" className="bg-[#131b2e]">Optimized</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Readout */}
              <div className="flex flex-col items-center justify-center p-8 border border-[#00f0ff]/30 rounded-lg bg-[#2d3449]/30 relative shadow-[0_0_30px_rgba(0,240,255,0.15)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00f0ff]/50 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00f0ff]/50 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00f0ff]/50 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00f0ff]/50 rounded-br"></div>
                
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#b9cacb] uppercase mb-4">Estimated Potential Loss (ALE)</span>
                <div className="font-mono text-5xl font-bold gradient-text tabular-nums transition-all duration-300">
                  {calculatedALE}
                </div>
                
                <div className="mt-6 flex items-center gap-2 text-[#ffb4ab] text-xs font-mono bg-[#93000a]/30 px-3 py-1 rounded border border-[#ffb4ab]/20">
                  <TrendingUp className="w-4 h-4 text-[#ffb4ab]" />
                  <span>High Risk Zone</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-16 px-8 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto bg-transparent border-t border-[#3b494b]/30 text-[#00dbe9]/85 font-mono text-[11px] z-10 mt-auto fade-in-up">
        <div className="mb-6 md:mb-0 text-center md:text-left">
          <div className="text-xl font-bold text-[#00f0ff] mb-2">CyberRiskIQ</div>
          <div className="opacity-80">© 2024 CyberRiskIQ. Precision Minimalist Security.</div>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="text-[#b9cacb] hover:text-[#00f0ff] transition-all opacity-80 hover:opacity-100" href="#">Platform</a>
          <a className="text-[#b9cacb] hover:text-[#00f0ff] transition-all opacity-80 hover:opacity-100" href="#">Analysis Engine</a>
          <a className="text-[#b9cacb] hover:text-[#00f0ff] transition-all opacity-80 hover:opacity-100" href="#">Risk Methodology</a>
          <a className="text-[#b9cacb] hover:text-[#00f0ff] transition-all opacity-80 hover:opacity-100" href="#">Privacy Protocol</a>
          <a className="text-[#b9cacb] hover:text-[#00f0ff] transition-all opacity-80 hover:opacity-100" href="#">System Status</a>
        </div>
      </footer>
    </div>
  );
}
