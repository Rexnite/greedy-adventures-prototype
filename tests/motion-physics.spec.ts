import { test, expect } from "@playwright/test";
import { initialMotion, advanceMotion } from "../lib/motion-physics";
test("camera accelerates then drag settles it, without unstable lens or roll", () => {
  for (const medium of ["sky", "ocean"] as const) {
    const motion = initialMotion();
    for (let i = 0; i < 80; i++) advanceMotion(motion, 1 / 120, medium);
    const peak = motion.velocity;
    expect(peak).toBeGreaterThan(5);
    for (let i = 0; i < 142; i++) advanceMotion(motion, 1 / 120, medium);
    expect(motion.velocity).toBeLessThan(peak * 0.05);
    expect(motion.distance).toBeGreaterThan(2);
    expect(motion.distance).toBeLessThan(15);
    expect(Math.abs(motion.roll)).toBeLessThan(0.03);
    expect(motion.fov).toBeGreaterThan(70);
    expect(motion.fov).toBeLessThan(90);
  }
  const sky = initialMotion(),
    water = initialMotion();
  for (let i = 0; i < 80; i++) {
    advanceMotion(sky, 1 / 120, "sky");
    advanceMotion(water, 1 / 120, "ocean");
  }
  expect(water.velocity).toBeLessThan(sky.velocity);
});
