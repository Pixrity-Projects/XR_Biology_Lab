import * as THREE from 'three';

export const state = {
  // Three.js Core
  camera: null,
  scene: null,
  renderer: null,
  controls: null,

  // Rigs for VR locomotion
  userRig: null,
  headRig: null,
  pitchOffset: 0,

  // Meshes
  infoPanelMesh: null,
  floorMesh: null,
  smartboardMesh: null,
  hotspotMeshes: [],
  controllers: [],

  // Interaction utilities
  raycaster: new THREE.Raycaster(),
  tempMatrix: new THREE.Matrix4(),
  clock: new THREE.Clock(),
  currentTextToRead: '',

  // Pop-up and zoom state
  selectedHotspot: null,
  prevBButtonPressed: [false, false],
  prevAButtonPressed: false,
  grippedControllers: [],
  poppedModel: null,
  initialZoomDistance: 0,
  initialPoppedScale: 1.0,
};
