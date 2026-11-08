"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { stick, typing, useGame } from "@/lib/store";
import { useLayout } from "@/lib/room";
import { doorYaw } from "./Room";
import { clampWalk, nearestDoor, shimizu } from "@/lib/flat-plan";

const DEG = Math.PI / 180;
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler(0, 0, 0, "YXZ");

// Room view: drag to look, WASD/arrows / touch stick to walk.
export function CameraRig() {
  const { camera, gl, events } = useThree();
  const held = useRef(new Set<string>());

  useEffect(() => {
    const el = gl.domElement;
    let last: { id: number; x: number; y: number } | null = null, fingers = 0;
    const down = (e: PointerEvent) => {
      fingers++;
      last = fingers === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const s = useGame.getState();
      if (s.choosing || !last || last.id !== e.pointerId || useLayout.getState().dragging) return;
      s.look((e.clientX - last.x) * 0.3 * s.sensitivity, (e.clientY - last.y) * 0.3 * s.sensitivity);
      last = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const up = () => { fingers = Math.max(0, fingers - 1); last = null; };
    const key = (e: KeyboardEvent) => {
      if (e.type === "keyup") { held.current.delete(e.key.toLowerCase()); return; }
      if (typing(e)) return;
      const s = useGame.getState();
      if (s.choosing || s.dialog) return;
      if (e.type === "keydown") {
        if (e.key === "m") useGame.setState({ muted: !s.muted });
        if (e.key.toLowerCase() === "e" && !e.repeat) {
          const plan = useLayout.getState().plan;
          const door = plan && nearestDoor(plan, s.roomPos[0], s.roomPos[2]);
          if (door) { s.toggleDoor(door.id); return; }
        }
        held.current.add(e.key.toLowerCase());
      }
    };
    const blur = () => held.current.clear();
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
      window.removeEventListener("blur", blur);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const s = useGame.getState();
    if (s.view !== "room") useGame.setState({ view: "room" });
    if (s.choosing) {
      tmpPos.set(...s.roomPos);
      tmpQuat.setFromEuler(tmpEuler.set(-s.pitch * DEG, -s.yaw * DEG, 0));
      camera.position.copy(tmpPos);
      camera.quaternion.copy(tmpQuat);
      return;
    }
    const k = held.current;
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));
    const h = clamp((k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0) + stick.x);
    const v = clamp((k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0) + stick.y);
    if (h || v) {
      const y = -s.yaw * DEG, step = 1.5 * Math.min(dt, 0.1);
      const dx = (h * Math.cos(y) - v * Math.sin(y)) * step;
      const dz = (-h * Math.sin(y) - v * Math.cos(y)) * step;
      const [x, py, z] = s.roomPos;
      const plan = useLayout.getState().plan ?? shimizu();
      const pass: Record<string, boolean> = {};
      for (const [id, on] of Object.entries(s.openDoors)) {
        if (on && Math.abs(doorYaw.get(id) ?? 0) > 1.05) pass[id] = true;
      }
      const [nx, nz] = clampWalk(plan, x + dx, z + dz, 0.22, pass);
      s.setRoomPos([nx, Math.min(plan.h - 0.3, Math.max(0.4, py)), nz]);
    }
    tmpPos.set(...s.roomPos);
    tmpQuat.setFromEuler(tmpEuler.set(-s.pitch * DEG, -s.yaw * DEG, 0));
    const t = 1 - Math.exp(-6 * Math.min(dt, 0.1));
    const moving = camera.position.distanceToSquared(tmpPos) > 1e-8 || 1 - Math.abs(camera.quaternion.dot(tmpQuat)) > 1e-8;
    camera.position.lerp(tmpPos, t);
    camera.quaternion.slerp(tmpQuat, t);
    if (moving) events.update?.();
  });

  return null;
}
