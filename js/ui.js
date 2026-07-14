import * as THREE from 'three';
import { state } from './state.js';

export function setupInfoPanel() {
  const geo = new THREE.PlaneGeometry(9.9, 4.4);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
  state.infoPanelMesh = new THREE.Mesh(geo, mat);
  state.infoPanelMesh.visible = false;
  state.infoPanelMesh.position.set(0, 3.5, -14.7);
  state.scene.add(state.infoPanelMesh);
}

export function updateSmartboard(data) {
  if (!state.smartboardMesh) {
    console.warn("state.smartboardMesh is undefined!");
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 2048, 1024);

  if (!data) {
    // Draw grid
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.15)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2048; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
    }
    for (let j = 0; j < 1024; j += 64) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(2048, j); ctx.stroke();
    }

    ctx.fillStyle = '#4ecdc4';
    ctx.font = 'bold 100px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('XR BIOLOGY LAB', 1024, 450);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '40px sans-serif';
    ctx.fillText('Select a biological model to inspect details', 1024, 580);
  } else {
    // Just the background grid, slightly dimmed
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2048; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
    }
    for (let j = 0; j < 1024; j += 64) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(2048, j); ctx.stroke();
    }
  }

  // Dispose old texture to prevent memory leaks
  if (state.smartboardMesh.material.map) {
    state.smartboardMesh.material.map.dispose();
  }

  // Force texture update
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Update the mesh material directly
  state.smartboardMesh.material.map = texture;
  state.smartboardMesh.material.needsUpdate = true;

  console.log("Smartboard texture updated for:", data ? data.title : "Welcome");
}

export function updateInfoPanel(data) {
  if (!state.infoPanelMesh) return;

  if (!data) {
    state.infoPanelMesh.visible = false;
    updateSmartboard(null);
    return;
  }

  state.infoPanelMesh.visible = true;
  updateSmartboard(data); // Puts smartboard in dimmed grid state

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 921; // 2048 * (3.4 / 7.5) aspect ratio (approx 16:7)
  const ctx = canvas.getContext('2d');

  // Transparent center, solid slate background panel
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(0, 0, 2048, 921, 48);
    ctx.fill();
    // Colored border matching organ's theme
    ctx.strokeStyle = '#' + data.color.toString(16).padStart(6, '0');
    ctx.lineWidth = 16;
    ctx.stroke();
  } else {
    ctx.fillRect(0, 0, 2048, 921);
  }

  // Draw Title
  ctx.fillStyle = '#' + data.color.toString(16).padStart(6, '0');
  ctx.font = 'bold 96px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.title, 1024, 180);

  // Draw Description with wrapping
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '54px sans-serif';
  const words = data.desc.split(' ');
  let line = '';
  const lines = [];
  const maxWidth = 1800;

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  let y = 360;
  lines.forEach((l) => {
    ctx.fillText(l.trim(), 1024, y);
    y += 80;
  });

  // Dispose of old texture
  if (state.infoPanelMesh.material.map) {
    state.infoPanelMesh.material.map.dispose();
  }

  // Update texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  state.infoPanelMesh.material.map = texture;
  state.infoPanelMesh.material.needsUpdate = true;
}
