import * as THREE from 'three';
import { state } from './state.js';
import { createWallTexture, createTileTexture, createWoodTexture } from './textures.js';
import { updateSmartboard } from './ui.js';

export function setupLighting() {
  state.scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1.0));

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(0, 10, 5);
  state.scene.add(dirLight);

  const pointLight1 = new THREE.PointLight(0x4ecdc4, 0.5, 30);
  pointLight1.position.set(-6, 3, -6);
  state.scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xff6b6b, 0.5, 30);
  pointLight2.position.set(6, 3, -6);
  state.scene.add(pointLight2);
}

export function setupEnvironment() {
  // Room bounds (30x30 to fit 3 rows)
  const roomGeo = new THREE.BoxGeometry(30, 12, 30);
  const wallTex = createWallTexture();
  const roomMat = new THREE.MeshStandardMaterial({ map: wallTex, side: THREE.BackSide, roughness: 0.9 });
  const room = new THREE.Mesh(roomGeo, roomMat);
  room.position.y = 6;
  state.scene.add(room);

  // Interactive Floor
  const floorGeo = new THREE.PlaneGeometry(30, 30, 1);
  const tileTex = createTileTexture();
  const floorMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 1, metalness: 0.2 });
  state.floorMesh = new THREE.Mesh(floorGeo, floorMat);
  state.floorMesh.rotation.x = -Math.PI / 2;
  state.floorMesh.position.y = 0.1;
  state.scene.add(state.floorMesh);

  // Row 1 Benches
  createLabBench(-2.5, 0, -3.5);
  createLabBench(2.5, 0, -3.5);

  // Row 2 Benches
  createLabBench(-2.5, 0, -7.5);
  createLabBench(2.5, 0, -7.5);

  // Row 3 Benches (Anatomy)
  createLabBench(-2.5, 0, -11.5);
  createLabBench(2.5, 0, -11.5);

  // Smartboard
  const boardGeo = new THREE.PlaneGeometry(10, 4.5);
  const boardMat = new THREE.MeshBasicMaterial({ color: 0xf8f1f1 });
  state.smartboardMesh = new THREE.Mesh(boardGeo, boardMat);
  state.smartboardMesh.position.set(0, 3.5, -14.89);
  state.scene.add(state.smartboardMesh);

  // Board backing (depth)
  const backGeo = new THREE.BoxGeometry(10, 4.5, 0.1);
  const backMat = new THREE.MeshStandardMaterial({ color: 0xf8f1f1, roughness: 0.2, metalness: 0.5 });
  const backing = new THREE.Mesh(backGeo, backMat);
  backing.position.set(0, 3.5, -14.9);
  state.scene.add(backing);

  const frameGeo = new THREE.BoxGeometry(10.2, 4.7, 0.05);
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 3.5, -14.95);
  state.scene.add(frame);

  // Render default smartboard content
  updateSmartboard(null);
}

export function createLabBench(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const topGeo = new THREE.BoxGeometry(3.5, 0.08, 1.8);
  const woodTex = createWoodTexture();
  const topMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.3 });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = 1.0;

  const baseGeo = new THREE.BoxGeometry(3.2, 0.96, 1.5);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.48;

  group.add(top, base);
  state.scene.add(group);
}
