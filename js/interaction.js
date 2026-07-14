import * as THREE from 'three';
import { state } from './state.js';
import { updateInfoPanel } from './ui.js';

export function setupControllers() {
  for (let i = 0; i < 2; i++) {
    const controller = state.renderer.xr.getController(i);
    controller.addEventListener('selectstart', onVRSelectStart);
    controller.addEventListener('squeezestart', onVRSqueezeStart);
    controller.addEventListener('squeezeend', onVRSqueezeEnd);

    controller.addEventListener('connected', (event) => {
      controller.userData.handedness = event.data.handedness;
      console.log(`Controller connected: index=${i}, handedness=${event.data.handedness}`);
    });
    controller.addEventListener('disconnected', () => {
      controller.userData.handedness = null;
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
    line.scale.z = 4;
    line.name = 'raycasterLine';
    controller.add(line);

    state.headRig.add(controller);
    state.controllers.push(controller);
  }
}

export function getControllerRaycastIntersection(controller) {
  state.tempMatrix.identity().extractRotation(controller.matrixWorld);
  state.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  state.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(state.tempMatrix);

  const hitSpheres = state.hotspotMeshes.map(g => g.userData.hitSphere);
  const intersects = state.raycaster.intersectObjects(hitSpheres, false);
  if (intersects.length > 0) {
    return intersects[0].object.parent.userData;
  }
  return null;
}

export function updateControllerRayColors() {
  state.controllers.forEach(controller => {
    const hitData = getControllerRaycastIntersection(controller);
    const line = controller.getObjectByName('raycasterLine');
    if (line) {
      line.material.color.setHex(hitData ? 0x00ffff : 0xffffff);
    }
  });
}

export function onVRSelectStart(event) {
  const controller = event.target;
  const data = getControllerRaycastIntersection(controller);
  if (data) {
    selectHotspot(data);
  } else {
    deselectHotspot();
  }
}

export function getGripMidpointDistanceToCamera() {
  if (state.grippedControllers.length < 2) return 0;
  const p1 = new THREE.Vector3();
  state.grippedControllers[0].getWorldPosition(p1);
  const p2 = new THREE.Vector3();
  state.grippedControllers[1].getWorldPosition(p2);
  
  const camPos = new THREE.Vector3();
  state.camera.getWorldPosition(camPos);
  
  const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  return camPos.distanceTo(midpoint);
}

export function onVRSqueezeStart(event) {
  const controller = event.target;
  if (!state.grippedControllers.includes(controller)) {
    state.grippedControllers.push(controller);
  }

  // Grip is squeezed: check raycast once, clone and hand-lock model if hitting a valid hotspot sphere
  const hitData = getControllerRaycastIntersection(controller);
  if (hitData && hitData.model) {
    if (controller.userData.poppedModel) {
      controller.remove(controller.userData.poppedModel);
      controller.userData.poppedModel = null;
    }

    const poppedModel = hitData.model.clone();
    
    // Position slightly above and in front of the hand
    poppedModel.position.set(0, 0.1, -0.2);
    poppedModel.rotation.set(0, 0, 0);

    // Scale to comfortable popped size
    const baseScale = hitData.model.userData.baseScale || 1.0;
    const targetScale = baseScale * 1.5;
    poppedModel.scale.setScalar(targetScale);
    poppedModel.userData.baseScale = targetScale;

    // Attach to controller to lock position/rotation to hand
    controller.add(poppedModel);
    controller.userData.poppedModel = poppedModel;

    // Keep global poppedModel reference pointing to active model for app.js rotation & zoom features
    state.poppedModel = poppedModel;
  }

  // If both controllers are gripped, initialize the zoom parameters
  if (state.grippedControllers.length === 2 && state.poppedModel) {
    state.initialZoomDistance = getGripMidpointDistanceToCamera();
    state.initialPoppedScale = state.poppedModel.scale.x;
  }
}

export function onVRSqueezeEnd(event) {
  const controller = event.target;
  state.grippedControllers = state.grippedControllers.filter(c => c !== controller);

  if (controller.userData.poppedModel) {
    const poppedModel = controller.userData.poppedModel;
    controller.remove(poppedModel);

    // Traverse and dispose of geometry & material to prevent GPU memory leaks
    poppedModel.traverse((node) => {
      if (node.isMesh) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((mat) => mat.dispose());
          } else {
            node.material.dispose();
          }
        }
      }
    });
    
    // Clear global poppedModel reference if it matches this one
    if (state.poppedModel === poppedModel) {
      const otherController = state.controllers.find(c => c !== controller);
      if (otherController && otherController.userData.poppedModel) {
        state.poppedModel = otherController.userData.poppedModel;
      } else {
        state.poppedModel = null;
      }
    }
    controller.userData.poppedModel = null;
  }
}

const pointerStart = { x: 0, y: 0 };
let pointerStartTime = 0;

export function onPointerDown(event) {
  if (event.target.tagName !== 'CANVAS') return;
  pointerStart.x = event.clientX;
  pointerStart.y = event.clientY;
  pointerStartTime = performance.now();
}

export function onPointerUp(event) {
  if (event.target.tagName !== 'CANVAS') return;

  const dist = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  const duration = performance.now() - pointerStartTime;

  // Threshold to distinguish tap/click from drag:
  if (dist < 8 && duration < 300) {
    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    state.raycaster.setFromCamera(pointer, state.camera);

    const hitSpheres = state.hotspotMeshes.map(g => g.userData.hitSphere);
    const intersects = state.raycaster.intersectObjects(hitSpheres, false);
    if (intersects.length > 0) {
      selectHotspot(intersects[0].object.parent.userData);
    } else {
      deselectHotspot();
    }
  }
}

export function selectHotspot(data) {
  console.log("Selecting hotspot:", data.title); // Debug check
  state.selectedHotspot = data;
  updateInfoPanel(data);
  state.currentTextToRead = `This is the ${data.title}. ${data.desc}`;
  speakText(state.currentTextToRead);
}

export function deselectHotspot() {
  state.selectedHotspot = null;
  updateInfoPanel(null);
  stopSpeaking();
}

export function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    const englishVoice = window.speechSynthesis.getVoices().find(v => v.lang.includes('en') && !v.localService);
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
