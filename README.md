# Vibe Coded XR Biology Lab

An interactive Virtual Reality Biology Lab built using **Gemini XR Blocks** and **Three.js**, showcasing modular ES6 spatial architecture, decoupled hand-locked inspection mechanics, and direct visual raycaster feedback.

---
## Demo Video
https://github.com/user-attachments/assets/9f11a771-c2f5-4468-ab8d-db2aa2d11eec

## Features & Current Working

The lab allows users to explore genetics, cell structures, and human anatomy with decoupled controls and a head-locked controls helper:

### 1. Decoupled VR Controls
- **Trigger Button (Select)**: Pulling the trigger on a hotspot selects it, displaying its details on the smartboard at the front of the lab and playing educational text-to-speech description.
- **Grip Button (Grip to Inspect)**: Squeezing the grip button on a controller pointing to any hotspot immediately clones its high-definition model and parents it directly to that controller (`controller.add(poppedModel)`). The model remains locked to the hand, following its physical position and rotation smoothly.
- **Deselect Safety**: Deselecting a hotspot (by pressing the B/Y button or clicking away) does *not* clear held models; they remain in the user's hand until they release the physical Grip button.
- **Locomotion**: Continuous joystick-based movement moves the entire player rig (`playerRig` Group containing the camera and controllers) rather than modifying the camera directly, ensuring ergonomic VR locomotion.

### 2. Visual Raycaster Feedback (Affordance)
- The controller raycaster line dynamically detects hotspots.
- When pointing directly at a valid hotspot sphere, the line changes color to **Cyan** (`0x00FFFF`).
- When pointing away, it turns back to **White** (`0xFFFFFF`).

### 3. Persistent 3D Controls Manual
- A head-locked controls manual plane is attached directly to the camera view (`(0, 0, -0.6)` offset, tilted slightly downwards at `x: -0.2` for ergonomic comfort).
- The manual remains in view during VR.
- Pressing the **A button** on the right controller debounces and toggles the manual's visibility.
- The manual is automatically hidden when in desktop mode to avoid blocking the viewport.

### 4. VR Composition & Memory Optimizations
- Confugured with `logarithmicDepthBuffer: false` to ensure maximum stability and compatibility with WebXR compositor engines.
- Built-in automatic resource disposal: releasing the Grip button disposes of the cloned model's meshes, geometries, and materials, preventing GPU memory leaks.

---

## Installation

Ensure you have [Node.js](https://nodejs.org/) installed, then follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sachin-paranjape/XRBioLab.git
   cd XRBioLab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

---

## Running the Project

Because WebXR requires a secure context (HTTPS) or local loopback (`localhost`), follow these steps to host and run the lab:

### 1. Start the HTTP Server
Run the local HTTP server to serve the static assets:
```bash
npx http-server -c-1 -p 8000
```

### 2. Expose over a Secure Tunnel (WebXR Requirement)
For VR headsets (e.g., Meta Quest Browser) to access the page, it must be loaded over HTTPS. Run the tunnel script, which starts Tunnelmole and bypasses DNS resolution issues:
```bash
node --dns-result-order=ipv4first run_tunnel_spawn.js
```
This script will:
- Establish a secure public tunnel to port `8000`.
- Output a secure public URL (e.g., `https://xxxx.tunnelmole.net`).
- Save the URL to `tunnel_url.txt`.

### 3. View in VR
1. Open the secure HTTPS URL in a WebXR-compatible browser (e.g., Meta Quest Browser, or Google Chrome with the WebXR API Emulator extension).
2. Click the **Enter VR** button at the bottom of the page.

---

## Repository Structure

- **index.html**: Initializes structural overlays, the hidden manual canvas, and loads the Three.js runtime.
- **js/app.js**: Initializes the WebGL context, OrbitControls, user rigs, camera parent relationships, and drives the rendering loop (`setAnimationLoop`).
- **js/data.js**: Stores hotspot coordinate positions, description labels, and model path references.
- **js/state.js**: Centralized namespace for global Three.js objects and controller debouncing parameters.
- **js/ui.js**: Manages smartboard rendering, info panels, and generating the controls manual text canvas.
- **js/interaction.js**: Handles event listeners for trigger selects, grip inspects, controller connection events, raycasting calculations, and GPU memory cleanup.
- **js/textures.js**: Generates procedural materials and patterns.
- **js/environment.js**: Builds room geometry, point lighting, and bench furniture.

---

## License

This project is licensed under the MIT License.
