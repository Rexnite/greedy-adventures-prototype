/** Fixed-step camera motion, in scene units. No DOM or React state in the simulation. */
export type Medium = "sky" | "ocean";
export type CameraMotion = {
  elapsed: number;
  distance: number;
  velocity: number;
  roll: number;
  angularVelocity: number;
  fov: number;
  fovVelocity: number;
};
export function initialMotion(): CameraMotion {
  return {
    elapsed: 0,
    distance: 0,
    velocity: 0,
    roll: -0.045,
    angularVelocity: 0,
    fov: 76,
    fovVelocity: 0,
  };
}
export function advanceMotion(state: CameraMotion, dt: number, medium: Medium) {
  state.elapsed += dt;
  const accelerated = state.elapsed < 0.72;
  const acceleration = accelerated ? (medium === "sky" ? 29 : 20) : 0;
  const drag = accelerated ? (medium === "sky" ? 0.7 : 1.6) : 6.2;
  state.velocity += (acceleration - drag * state.velocity) * dt;
  state.distance += state.velocity * dt;
  // Critically damped springs return the camera to level and settle the lens.
  const targetRoll = accelerated
    ? Math.sin(state.elapsed * 3.8) * (medium === "sky" ? 0.055 : 0.025)
    : 0;
  state.angularVelocity +=
    ((targetRoll - state.roll) * 75 - 17.4 * state.angularVelocity) * dt;
  state.roll += state.angularVelocity * dt;
  const targetFov = 76 + Math.min(12, state.velocity * 0.8);
  state.fovVelocity +=
    ((targetFov - state.fov) * 90 - 19 * state.fovVelocity) * dt;
  state.fov += state.fovVelocity * dt;
  return state;
}
