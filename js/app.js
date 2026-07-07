import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { state } from './state.js';
import { setupLighting, setupEnvironment } from './environment.js';
import { setupHotspots, lazyLoadGLBModels } from './models.js';
import { setupInfoPanel } from './ui.js';
import { setupControllers, onPointerDown, onPointerUp } from './interaction.js';

// --- XR BUTTON UTILITY ---
const XRButton = {
  createButton(renderer, sessionInit = null) {
    if (sessionInit === null) {
      sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor'] };
    }
    const button = document.createElement('button');
    button.id = 'xr-button';
    button.style.display = 'none';

    if (!window.isSecureContext) {
      console.warn('WebXR requires a secure context (HTTPS) or localhost.');
      button.style.display = 'block';
      button.textContent = 'HTTPS REQUIRED';
      button.classList.add('disabled');
      button.onclick = null;
      return button;
    }

    let currentSession = null;

    function showButton(label, sessionType) {
      button.style.display = 'block';
      button.textContent = label;
      button.className = '';

      let isRequesting = false;

      button.onclick = async () => {
        if (isRequesting) return;

        if (currentSession === null) {
          isRequesting = true;
          button.textContent = 'STARTING...';
          button.style.pointerEvents = 'none';

          try {
            const options = sessionType === 'immersive-vr' ? sessionInit : {};
            const session = await renderer.xr.requestSession(sessionType, options);

            // Monkey-patch requestReferenceSpace to support fallback from bounded-floor to local-floor
            const originalRequestReferenceSpace = session.requestReferenceSpace;
            session.requestReferenceSpace = function (type) {
              if (type === 'bounded-floor' || type === 'local-floor') {
                return originalRequestReferenceSpace.call(session, 'bounded-floor')
                  .catch(() => originalRequestReferenceSpace.call(session, 'local-floor'))
                  .catch(() => originalRequestReferenceSpace.call(session, type));
              }
              return originalRequestReferenceSpace.call(session, type);
            };

            if (sessionType === 'immersive-vr') {
              renderer.xr.setReferenceSpaceType('bounded-floor');
            } else {
              renderer.xr.setReferenceSpaceType('viewer');
            }

            const onSessionEnded = () => {
              currentSession.removeEventListener('end', onSessionEnded);
              button.textContent = label;
              currentSession = null;
              button.style.pointerEvents = 'auto';
            };
            session.addEventListener('end', onSessionEnded);

            await renderer.xr.setSession(session);
            button.textContent = sessionType === 'immersive-vr' ? 'EXIT VR' : 'EXIT MAGIC WINDOW';
            currentSession = session;
            button.style.pointerEvents = 'auto';
          } catch (err) {
            console.error('Failed to start WebXR session:', err);
            button.textContent = 'ERROR STARTING';
            setTimeout(() => {
              button.textContent = label;
              button.style.pointerEvents = 'auto';
            }, 2000);
          } finally {
            isRequesting = false;
          }
        } else {
          currentSession.end();
        }
      };
    }

    function showVRNotSupported() {
      button.style.display = 'block';
      button.textContent = 'VR NOT SUPPORTED';
      button.classList.add('disabled');
      button.onclick = null;
    }

    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-vr')
        .then((supported) => {
          if (supported) {
            showButton('ENTER VR', 'immersive-vr');
          } else {
            navigator.xr.isSessionSupported('inline')
              .then((inlineSupported) => {
                if (inlineSupported) {
                  showButton('ENTER MAGIC WINDOW', 'inline');
                } else {
                  showVRNotSupported();
                }
              })
              .catch(() => showVRNotSupported());
          }
        })
        .catch(() => showVRNotSupported());
    } else {
      showVRNotSupported();
    }

    return button;
  }
};

export async function init() {
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x1a1a2e);
  state.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);

  state.userRig = new THREE.Group();
  state.userRig.position.set(0, 0, 2);
  state.scene.add(state.userRig);

  state.headRig = new THREE.Group();
  state.userRig.add(state.headRig);

  state.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  state.camera.position.set(0, 1.7, 0);
  state.headRig.add(state.camera);

  state.renderer = new THREE.WebGLRenderer({ antialias: true, xrCompatible: true, logarithmicDepthBuffer: true });
  state.renderer.setPixelRatio(window.devicePixelRatio);
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.xr.enabled = true;
  state.renderer.xr.setReferenceSpaceType('local-floor');
  state.renderer.xr.requestSession = (sessionType, options) => navigator.xr.requestSession(sessionType, options);

  document.body.appendChild(state.renderer.domElement);
  document.body.appendChild(XRButton.createButton(state.renderer));

  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.target.set(0, 1.4, -3.5);
  state.controls.update();

  setupLighting();
  setupEnvironment();
  setupHotspots(); // Instant — procedural models only
  setupInfoPanel();
  setupControllers();

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', onWindowResize);

  if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

  // Hide loading overlay — scene is ready with procedural models
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => overlay.remove(), 600);
  }

  state.renderer.setAnimationLoop(animate);

  // Start loading HD GLB models in the background
  lazyLoadGLBModels();
}

function onWindowResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(timestamp, frame) {
  const time = performance.now() * 0.002;
  const delta = state.clock.getDelta();

  if (state.renderer.xr.isPresenting) {
    state.controls.enabled = false;

    // 1. XR Camera Tracking (Handles head tracking)
    if (frame) {
      const referenceSpace = state.renderer.xr.getReferenceSpace();
      const pose = frame.getViewerPose(referenceSpace);
      if (pose) {
        state.camera.matrix.fromArray(pose.transform.matrix);
        state.camera.matrix.decompose(state.camera.position, state.camera.quaternion, state.camera.scale);

        // Apply sitting/standing camera angle adjustments + manual pitchOffset rotation around camera's position
        const basePitch = (1.4 - state.camera.position.y) * 0.4;
        const totalPitch = basePitch + state.pitchOffset;

        const rightRig = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion);
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(rightRig, totalPitch);
        state.headRig.quaternion.copy(pitchQuat);
        const rotatedCamPos = state.camera.position.clone().applyQuaternion(pitchQuat);
        state.headRig.position.copy(state.camera.position).sub(rotatedCamPos);

        state.camera.updateMatrixWorld(true);
      }
    }

    // 2. Controller-based Locomotion & Rotation
    const session = state.renderer.xr.getSession();
    if (session) {
      const speed = 2.5;
      const moveVector = new THREE.Vector3();

      session.inputSources.forEach((source) => {
        if (!source.gamepad || !source.gamepad.axes) return;

        const axes = source.gamepad.axes;
        const handedness = source.handedness; // 'left' or 'right'

        // LEFT CONTROLLER: Rotation & Pitch
        if (handedness === 'left') {
          if (Math.abs(axes[2]) > 0.1) {
            state.userRig.rotation.y -= axes[2] * 1.5 * delta;
          }
          if (Math.abs(axes[3]) > 0.1) {
            state.pitchOffset -= axes[3] * 1.0 * delta;
            state.pitchOffset = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, state.pitchOffset));
          }
        }

        // RIGHT CONTROLLER: Movement
        if (handedness === 'right' && (Math.abs(axes[2]) > 0.1 || Math.abs(axes[3]) > 0.1)) {
          const forward = new THREE.Vector3(0, 0, -1).transformDirection(state.camera.matrixWorld);
          forward.y = 0; forward.normalize();

          const right = new THREE.Vector3(1, 0, 0).transformDirection(state.camera.matrixWorld);
          right.y = 0; right.normalize();

          moveVector.addScaledVector(forward, -axes[3]);
          moveVector.addScaledVector(right, axes[2]);
        }
      });

      // Collision & Movement
      if (moveVector.lengthSq() > 0.001) {
        moveVector.normalize().multiplyScalar(speed * delta);
        const nextPos = state.userRig.position.clone().add(moveVector);

        const benches = [
          { x: -2.5, z: -3.5 }, { x: 2.5, z: -3.5 },
          { x: -2.5, z: -7.5 }, { x: 2.5, z: -7.5 },
          { x: -2.5, z: -11.5 }, { x: 2.5, z: -11.5 }
        ];

        let collision = benches.some(b => nextPos.distanceTo(new THREE.Vector3(b.x, 0, b.z)) < 1.5);

        if (!collision) {
          state.userRig.position.copy(nextPos);
        }

        // Lab boundaries
        state.userRig.position.x = Math.max(-14, Math.min(14, state.userRig.position.x));
        state.userRig.position.z = Math.max(-14, Math.min(14, state.userRig.position.z));
      }
    }

    // 3. Model Animations & Labels
    state.hotspotMeshes.forEach((group, i) => {
      group.position.y = group.userData.baseY + Math.sin(time + i) * 0.05;
      if (group.userData.model) {
        if (['heart', 'brain', 'lungs', 'bone'].includes(group.userData.type)) {
          group.userData.model.rotation.y += 0.005;
          const baseScale = group.userData.model.userData.baseScale || 1.0;
          if (group.userData.type === 'heart') {
            const s = baseScale * (1 + Math.sin(time * 4) * 0.05);
            group.userData.model.scale.set(s, s, s);
          }
          if (group.userData.type === 'lungs') {
            const s = baseScale * (1 + Math.sin(time * 2) * 0.04);
            group.userData.model.scale.set(s, s, s);
          }
        } else {
          group.userData.model.rotation.y += 0.01;
          if (group.userData.type === 'dna') group.userData.model.rotation.y += 0.02;
        }
      }
      if (group.userData.label) {
        const camPos = new THREE.Vector3();
        state.camera.getWorldPosition(camPos);
        group.userData.label.lookAt(camPos);
      }
    });

    state.renderer.render(state.scene, state.camera);
  } else {
    // Desktop / non-VR mode
    state.controls.enabled = true;

    // Model Animations & Labels
    state.hotspotMeshes.forEach((group, i) => {
      group.position.y = group.userData.baseY + Math.sin(time + i) * 0.05;
      if (group.userData.model) {
        if (['heart', 'brain', 'lungs', 'bone'].includes(group.userData.type)) {
          group.userData.model.rotation.y += 0.005;
          const baseScale = group.userData.model.userData.baseScale || 1.0;
          if (group.userData.type === 'heart') {
            const s = baseScale * (1 + Math.sin(time * 4) * 0.05);
            group.userData.model.scale.set(s, s, s);
          }
          if (group.userData.type === 'lungs') {
            const s = baseScale * (1 + Math.sin(time * 2) * 0.04);
            group.userData.model.scale.set(s, s, s);
          }
        } else {
          group.userData.model.rotation.y += 0.01;
          if (group.userData.type === 'dna') group.userData.model.rotation.y += 0.02;
        }
      }
      if (group.userData.label) {
        const camPos = new THREE.Vector3();
        state.camera.getWorldPosition(camPos);
        group.userData.label.lookAt(camPos);
      }
    });

    state.renderer.render(state.scene, state.camera);
  }
}
