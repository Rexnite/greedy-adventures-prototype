import * as THREE from "three";
import { initialMotion, advanceMotion, type Medium } from "./motion-physics";
export type ImmersiveTheme = "sky" | "ocean" | "tide";
export type ImmersiveEngine = {
  play: (
    theme: ImmersiveTheme,
    onArrive: () => void,
    onComplete: () => void,
  ) => void;
  stop: () => void;
  dispose: () => void;
};
const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const maskGLSL = `uniform vec2 resolution;uniform float progress;uniform float entry;
float screenMask(){vec2 st=gl_FragCoord.xy/resolution-.5;st.x*=resolution.x/resolution.y;
float diagonal=length(vec2(.5*resolution.x/resolution.y,.5));
float aperture=mix(-.24,diagonal+.3,smoothstep(.56,1.0,progress));
float feather=smoothstep(aperture-.24,aperture+.24,length(st));
float landingFade=1.-smoothstep(.58,1.,progress);
return feather*landingFade*entry;}`;
function cloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  // A texture is painted once; no canvas painting or noise generation occurs during flight.
  for (let i = 0; i < 42; i++) {
    const angle = i * 2.399963;
    const radius = 40 + Math.sqrt(i / 42) * 130;
    const x = 256 + Math.cos(angle) * radius,
      y = 256 + Math.sin(angle) * radius * 0.65;
    const size = 60 + (i % 5) * 13;
    const g = ctx.createRadialGradient(x, y, 0, x, y, size);
    g.addColorStop(0, "rgba(245,251,255,.26)");
    g.addColorStop(0.38, "rgba(233,245,255,.17)");
    g.addColorStop(1, "rgba(220,239,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
export async function createImmersiveRenderer(
  canvas: HTMLCanvasElement,
): Promise<ImmersiveEngine> {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
    premultipliedAlpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  const gl = renderer.getContext();
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = debug
    ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
    : "";
  const software = /(swiftshader|llvmpipe|software|microsoft basic|warp)/i.test(
    gpu,
  );
  const maxDimension = software ? 800 : 1280;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const loader = new THREE.TextureLoader();
  let sky: THREE.Texture, ocean: THREE.Texture;
  try {
    [sky, ocean] = await Promise.all([
      loader.loadAsync("/media/pov-sky.webp"),
      loader.loadAsync("/media/pov-ocean.webp"),
    ]);
  } catch (e) {
    renderer.dispose();
    throw e;
  }
  for (const texture of [sky, ocean]) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(76, 1, 0.1, 90);
  const shared = {
    resolution: { value: new THREE.Vector2() },
    progress: { value: 0 },
    entry: { value: 0 },
  };
  const backdropMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...shared,
      map: { value: sky },
      clock: { value: 0 },
      water: { value: 0 },
      travel: { value: 0 },
    },
    vertexShader: vertex,
    fragmentShader: `varying vec2 vUv;uniform sampler2D map;uniform float clock;uniform float water;uniform float travel;${maskGLSL}
 void main(){vec2 p=vUv;float depth=texture2D(map,p).r;
 p+=(p-.5)*depth*travel*.004;
 vec2 ripple=vec2(sin(p.y*32.+clock*2.7),cos(p.x*26.+clock*2.1))*.0022;
 float waterline=1.1-smoothstep(0.,.45,clock)*1.35;
 float edge=exp(-abs(gl_FragCoord.y/resolution.y-waterline)*70.)*water*(1.-smoothstep(.35,.55,clock));
 p+=ripple*water+vec2(sin(p.y*44.+clock*5.)*.012*edge,edge*.006);
 vec3 color=texture2D(map,clamp(p,.001,.999)).rgb+vec3(.35,.5,.5)*edge;
 gl_FragColor=vec4(color,screenMask());
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
  });
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    backdropMaterial,
  );
  backdrop.position.z = -36;
  backdrop.renderOrder = 0;
  scene.add(backdrop);
  const cloudMap = cloudTexture();
  const cloudMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { ...shared, map: { value: cloudMap }, opacity: { value: 0.78 } },
    vertexShader: vertex,
    fragmentShader: `varying vec2 vUv;uniform sampler2D map;uniform float opacity;${maskGLSL}void main(){vec4 c=texture2D(map,vUv);gl_FragColor=vec4(c.rgb,c.a*opacity*screenMask());}`,
  });
  const cloudGeometry = new THREE.PlaneGeometry(10, 7);
  const clouds = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    const a = i * 2.39996;
    const radius = 3.6 + (i % 3) * 1.4;
    cloud.position.set(
      Math.cos(a) * radius,
      Math.sin(a) * radius * 0.65,
      -2 - i * 1.8,
    );
    cloud.rotation.z = a * 0.2;
    cloud.renderOrder = 1;
    clouds.add(cloud);
  }
  scene.add(clouds);
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(132 * 3);
  const sizes = new Float32Array(132);
  for (let i = 0; i < 132; i++) {
    const a = i * 2.39996;
    const radius = 1.3 + (i % 17) * 0.42;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius * 0.7;
    positions[i * 3 + 2] = -1 - (i % 37) * 0.8;
    sizes[i] = 4 + (i % 5) * 2.7;
  }
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  const particleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { ...shared, clock: { value: 0 }, water: { value: 1 } },
    vertexShader: `attribute float size;uniform float clock;uniform float water;varying float alpha;void main(){vec3 p=position;p.y+=sin(clock*1.2+position.x)*.12*water;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*7./max(1.,-mv.z),1.,42.);alpha=min(1.,-mv.z*.25);}`,
    fragmentShader: `varying float alpha;uniform float water;${maskGLSL}void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float rim=smoothstep(.45,.95,r)*(1.-smoothstep(.9,1.,r));float glint=exp(-length(gl_PointCoord-vec2(.3,.72))*17.);float a=(rim*.35+glint*.6)*(1.-smoothstep(.93,1.,r));gl_FragColor=vec4(vec3(.76,.95,1.),a*alpha*screenMask());}`,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.renderOrder = 2;
  scene.add(particles);
  // A near-field aircraft doorway is physically passed by the camera at takeoff.
  const door = new THREE.Group();
  const doorOutline = new THREE.Shape();
  doorOutline.moveTo(-2, -1.6);
  doorOutline.lineTo(2, -1.6);
  doorOutline.lineTo(2, 1.6);
  doorOutline.lineTo(-2, 1.6);
  doorOutline.closePath();
  const opening = new THREE.Path();
  opening.moveTo(-0.72, -0.68);
  opening.lineTo(-0.72, 0.68);
  opening.lineTo(0.72, 0.68);
  opening.lineTo(0.72, -0.68);
  opening.closePath();
  doorOutline.holes.push(opening);
  const doorGeometry = new THREE.ShapeGeometry(doorOutline);
  const doorMaterial = new THREE.MeshBasicMaterial({
    color: 0x263640,
    transparent: true,
    depthWrite: false,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const doorFrame = new THREE.Mesh(doorGeometry, doorMaterial);
  doorFrame.position.z = -1.1;
  doorFrame.renderOrder = 3;
  door.add(doorFrame);
  scene.add(door);
  let raf = 0,
    stopped = false,
    disposed = false;
  let resolutionScale = 1;
  const resize = () => {
    const width = innerWidth,
      height = innerHeight;
    const ratio =
      Math.min(devicePixelRatio, 1.25, maxDimension / Math.max(width, height)) *
      resolutionScale;
    const renderWidth = Math.max(1, Math.round(width * ratio)),
      renderHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== renderWidth || canvas.height !== renderHeight)
      renderer.setSize(renderWidth, renderHeight, false);
    renderer.getDrawingBufferSize(shared.resolution.value);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    doorFrame.scale.set(camera.aspect, 1, 1);
    // Keep the photograph behind the frustum even at the widest lens angle.
    const coverHeight =
      2 * 36 * Math.tan(THREE.MathUtils.degToRad(94) / 2) * 1.14;
    const image = sky.image as HTMLImageElement;
    const imageAspect = image.width / image.height;
    backdrop.scale.set(
      Math.max(coverHeight * imageAspect, coverHeight * camera.aspect),
      Math.max(coverHeight, (coverHeight * camera.aspect) / imageAspect),
      1,
    );
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });
  renderer.initTexture(sky);
  renderer.initTexture(ocean);
  renderer.initTexture(cloudMap);
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  gl.finish(); // Finish the one-time upload during warmup, never during a click.
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
  const play = (
    theme: ImmersiveTheme,
    onArrive: () => void,
    onComplete: () => void,
  ) => {
    if (disposed) {
      onArrive();
      onComplete();
      return;
    }
    stop();
    stopped = false;
    const medium: Medium = theme === "sky" ? "sky" : "ocean";
    const isWater = medium === "ocean";
    backdropMaterial.uniforms.map.value = isWater ? ocean : sky;
    backdropMaterial.uniforms.water.value = isWater ? 1 : 0;
    clouds.visible = !isWater;
    door.visible = !isWater;
    particles.visible = isWater;
    resize();
    const motion = initialMotion();
    const duration = 1.85;
    let start = 0,
      previous = 0,
      accumulator = 0,
      arrived = false,
      slowFrames = 0;
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    const tick = (now: number) => {
      if (stopped) return;
      if (!start) {
        start = now;
        previous = now;
      }
      const elapsed = (now - start) / 1000;
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      accumulator += delta;
      while (accumulator >= 1 / 120) {
        advanceMotion(motion, 1 / 120, medium);
        accumulator -= 1 / 120;
      }
      const progress = Math.min(elapsed / duration, 1);
      shared.progress.value = progress;
      shared.entry.value = THREE.MathUtils.smoothstep(elapsed, 0, 0.16);
      camera.position.z = -motion.distance;
      camera.position.x = Math.sin(motion.elapsed * 2.1) * 0.06;
      camera.position.y = -motion.distance * (isWater ? 0.1 : 0.16);
      door.visible = !isWater && elapsed < 0.45;
      doorMaterial.opacity =
        shared.entry.value *
        (1 - THREE.MathUtils.smoothstep(elapsed, 0.21, 0.45));
      camera.rotation.z = motion.roll;
      camera.rotation.x = isWater ? -0.015 : -0.035;
      camera.fov = motion.fov;
      camera.updateProjectionMatrix();
      backdropMaterial.uniforms.clock.value = elapsed;
      backdropMaterial.uniforms.travel.value = motion.distance;
      particleMaterial.uniforms.clock.value = elapsed;
      // The page is positioned before the soft reveal starts at 56% of the journey.
      if (!arrived && progress > 0.52) {
        arrived = true;
        onArrive();
      }
      renderer.render(scene, camera);
      // Reduce framebuffer cost on the next journey if this device cannot keep up.
      if (delta > 0.027 && elapsed > 0.2) slowFrames++;
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        if (slowFrames > 10 && resolutionScale > 0.6) {
          resolutionScale = 0.65;
        }
        stopped = true;
        onComplete();
      }
    };
    raf = requestAnimationFrame(tick);
  };
  return {
    play,
    stop,
    dispose() {
      stop();
      disposed = true;
      window.removeEventListener("resize", resize);
      sky.dispose();
      ocean.dispose();
      cloudMap.dispose();
      backdrop.geometry.dispose();
      cloudGeometry.dispose();
      doorGeometry.dispose();
      doorMaterial.dispose();
      particleGeometry.dispose();
      backdropMaterial.dispose();
      cloudMaterial.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    },
  };
}
