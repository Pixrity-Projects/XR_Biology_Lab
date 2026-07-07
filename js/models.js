import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { state } from './state.js';
import { HOTSPOTS_DATA } from './data.js';
import { createTooltipTexture } from './textures.js';

export function createBiologicalModel(type, color) {
  const group = new THREE.Group();

  if (type === 'dna') {
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const linkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
    const mat1 = new THREE.MeshPhongMaterial({ color: color, emissive: color, emissiveIntensity: 0.2 });
    const mat2 = new THREE.MeshPhongMaterial({ color: 0x4ecdc4, emissive: 0x4ecdc4, emissiveIntensity: 0.2 });
    const linkMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    for (let i = 0; i < 12; i++) {
      const y = (i - 5.5) * 0.12; const angle = i * 0.6;
      const p1 = new THREE.Mesh(sphereGeo, mat1); p1.position.set(Math.cos(angle) * 0.25, y, Math.sin(angle) * 0.25);
      const p2 = new THREE.Mesh(sphereGeo, mat2); p2.position.set(Math.cos(angle + Math.PI) * 0.25, y, Math.sin(angle + Math.PI) * 0.25);
      const link = new THREE.Mesh(linkGeo, linkMat); link.position.set(0, y, 0); link.rotation.y = -angle; link.rotation.z = Math.PI / 2;
      group.add(p1, p2, link);
    }
  } else if (type === 'nucleus') {
    const membraneGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const membraneMat = new THREE.MeshPhongMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.4, shininess: 100 });
    const membrane = new THREE.Mesh(membraneGeo, membraneMat);
    const coreGeo = new THREE.IcosahedronGeometry(0.15, 1);
    const coreMat = new THREE.MeshPhongMaterial({ color: color, wireframe: true });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(membrane, core);
  } else if (type === 'chromosome') {
    const capGeo = new THREE.CapsuleGeometry(0.06, 0.4, 16, 16);
    const capMat = new THREE.MeshPhongMaterial({ color: color, emissive: color, emissiveIntensity: 0.3 });
    const arm1 = new THREE.Mesh(capGeo, capMat); arm1.rotation.z = Math.PI / 6;
    const arm2 = new THREE.Mesh(capGeo, capMat); arm2.rotation.z = -Math.PI / 6;
    const centerGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const centerMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const centromere = new THREE.Mesh(centerGeo, centerMat);
    group.add(arm1, arm2, centromere);
  } else if (type === 'basepair') {
    const bbGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
    const bbMat = new THREE.MeshPhongMaterial({ color: 0x4ecdc4 });
    const bb1 = new THREE.Mesh(bbGeo, bbMat); bb1.position.x = -0.25;
    const bb2 = new THREE.Mesh(bbGeo, bbMat); bb2.position.x = 0.25;
    const pGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25);
    const pairA = new THREE.Mesh(pGeo, new THREE.MeshPhongMaterial({ color: 0xff6b6b })); pairA.rotation.z = Math.PI / 2; pairA.position.x = -0.125;
    const pairT = new THREE.Mesh(pGeo, new THREE.MeshPhongMaterial({ color: 0xffe66d })); pairT.rotation.z = Math.PI / 2; pairT.position.x = 0.125;
    group.add(bb1, bb2, pairA, pairT);
  } else if (type === 'mitochondria') {
    const bodyGeo = new THREE.CapsuleGeometry(0.15, 0.2, 16, 32);
    const bodyMat = new THREE.MeshPhongMaterial({ color: color, transparent: true, opacity: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat); body.rotation.z = Math.PI / 2;
    const innerGeo = new THREE.CapsuleGeometry(0.12, 0.15, 8, 16);
    const innerMat = new THREE.MeshPhongMaterial({ color: 0xffe0b2, wireframe: true });
    const inner = new THREE.Mesh(innerGeo, innerMat); inner.rotation.z = Math.PI / 2;
    group.add(body, inner);
  } else if (type === 'ribosome') {
    const largeUnit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshPhongMaterial({ color: color }));
    const smallUnit = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshPhongMaterial({ color: 0x93c5fd }));
    smallUnit.position.set(0.1, -0.05, 0);
    group.add(largeUnit, smallUnit);
  } else if (type === 'er') {
    const foldMat = new THREE.MeshPhongMaterial({ color: color });
    for (let i = 0; i < 3; i++) {
      const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16), foldMat);
      fold.scale.set(1, 1, 0.2); fold.position.set((i - 1) * 0.12, 0, 0); fold.rotation.z = Math.sin(i) * 0.2;
      group.add(fold);
    }
  } else if (type === 'golgi') {
    const stackMat = new THREE.MeshPhongMaterial({ color: color });
    for (let i = 0; i < 4; i++) {
      const stack = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 16, 32, Math.PI), stackMat);
      stack.scale.set(1 - (i * 0.1), 1, 1); stack.position.set(0, (i * 0.06) - 0.1, 0); stack.rotation.x = Math.PI / 2;
      group.add(stack);
    }
  } else if (type === 'heart') {
    const hMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.1 });
    const leftLobe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), hMat); leftLobe.position.set(-0.06, 0.06, 0);
    const rightLobe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), hMat); rightLobe.position.set(0.06, 0.06, 0);
    const bottom = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.25, 16), hMat); bottom.position.set(0, -0.06, 0); bottom.rotation.z = Math.PI;
    const arteryMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const artery = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1), arteryMat); artery.position.set(0, 0.15, 0);
    group.add(leftLobe, rightLobe, bottom, artery);
  } else if (type === 'brain') {
    const bMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
    const leftHem = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.15, 16, 16), bMat); leftHem.rotation.x = Math.PI / 2; leftHem.position.set(-0.07, 0, 0);
    const rightHem = leftHem.clone(); rightHem.position.set(0.07, 0, 0);
    const cerebellum = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), bMat); cerebellum.position.set(0, -0.08, -0.08);
    group.add(leftHem, rightHem, cerebellum);
  } else if (type === 'lungs') {
    const lMat = new THREE.MeshStandardMaterial({ color: color, transparent: true, opacity: 0.9, roughness: 0.5 });
    const leftLung = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.18, 16, 16), lMat); leftLung.position.set(-0.11, 0, 0); leftLung.rotation.z = -0.15;
    const rightLung = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.18, 16, 16), lMat); rightLung.position.set(0.11, 0, 0); rightLung.rotation.z = 0.15;
    const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15), new THREE.MeshStandardMaterial({ color: 0xffffff })); trachea.position.set(0, 0.18, 0);
    group.add(leftLung, rightLung, trachea);
  } else if (type === 'bone') {
    const boMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35), boMat);
    const end1a = new THREE.Mesh(new THREE.SphereGeometry(0.05), boMat); end1a.position.set(0.03, 0.18, 0);
    const end1b = new THREE.Mesh(new THREE.SphereGeometry(0.05), boMat); end1b.position.set(-0.03, 0.18, 0);
    const end2a = new THREE.Mesh(new THREE.SphereGeometry(0.05), boMat); end2a.position.set(0.03, -0.18, 0);
    const end2b = new THREE.Mesh(new THREE.SphereGeometry(0.05), boMat); end2b.position.set(-0.03, -0.18, 0);
    group.add(shaft, end1a, end1b, end2a, end2b);
    group.rotation.z = Math.PI / 4;
  }
  group.userData.baseScale = 1.0;
  return group;
}

export function createGLTFLoader() {
  const gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  dracoLoader.setDecoderConfig({ type: 'js' }); // JS decoder works everywhere
  gltfLoader.setDRACOLoader(dracoLoader);
  return gltfLoader;
}

export function setupHotspots() {
  HOTSPOTS_DATA.forEach((data) => {
    const group = new THREE.Group();
    group.position.fromArray(data.pos);
    group.userData = { ...data, baseY: data.pos[1] };

    const model = createBiologicalModel(data.type, data.color);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const targetScale = 0.4 / maxDim;
      model.scale.setScalar(targetScale);
      model.userData.baseScale = targetScale;
      model.position.set(
        -center.x * targetScale,
        -center.y * targetScale,
        -center.z * targetScale
      );
    }

    group.add(model);
    group.userData.model = model;

    const colorHex = '#' + data.color.toString(16).padStart(6, '0');
    const labelTex = createTooltipTexture(data.title, colorHex);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, side: THREE.DoubleSide, depthTest: false });
    const labelGeo = new THREE.PlaneGeometry(0.8, 0.2);
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, 0.8, 0);
    group.add(labelMesh);
    group.userData.label = labelMesh;

    const hitGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitSphere = new THREE.Mesh(hitGeo, hitMat);
    group.add(hitSphere);
    group.userData.hitSphere = hitSphere;

    state.scene.add(group);
    state.hotspotMeshes.push(group);
  });
}

export function lazyLoadGLBModels() {
  const gltfLoader = createGLTFLoader();
  const modelsToLoad = state.hotspotMeshes.filter(g => g.userData.model && g.userData.model !== undefined && HOTSPOTS_DATA.find(d => d.id === g.userData.id)?.model);

  if (modelsToLoad.length === 0) return;

  const toast = document.getElementById('bg-loading-toast');
  const toastText = document.getElementById('bg-loading-text');
  const toastBar = document.getElementById('bg-loading-bar');

  if (toast) toast.classList.remove('hidden');

  let loaded = 0;
  const total = modelsToLoad.length;

  modelsToLoad.forEach((group) => {
    const data = group.userData;
    const modelPath = HOTSPOTS_DATA.find(d => d.id === data.id)?.model;
    if (!modelPath) return;

    if (toastText) toastText.textContent = `Loading ${data.title}...`;

    gltfLoader.load(
      modelPath,
      (gltf) => {
        const newModel = gltf.scene;

        const box = new THREE.Box3().setFromObject(newModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = (data.modelScale || 0.4) / maxDim;
        newModel.scale.setScalar(targetScale);
        newModel.userData.baseScale = targetScale;
        newModel.position.set(
          -center.x * targetScale,
          -center.y * targetScale,
          -center.z * targetScale
        );

        if (group.userData.model) {
          group.remove(group.userData.model);
        }
        group.add(newModel);
        group.userData.model = newModel;

        console.log(`Loaded .glb model for: ${data.title}`);

        loaded++;
        const pct = Math.round((loaded / total) * 100);
        if (toastBar) toastBar.style.width = pct + '%';
        if (toastText) toastText.textContent = `Loaded ${loaded}/${total} HD models`;

        if (loaded === total) {
          setTimeout(() => {
            if (toast) toast.classList.add('hidden');
          }, 1500);
        }
      },
      undefined,
      (err) => {
        console.warn(`Failed to load .glb for ${data.title}, keeping procedural:`, err);
        loaded++;
        const pct = Math.round((loaded / total) * 100);
        if (toastBar) toastBar.style.width = pct + '%';
        if (loaded === total) {
          setTimeout(() => {
            if (toast) toast.classList.add('hidden');
          }, 1500);
        }
      }
    );
  });
}
