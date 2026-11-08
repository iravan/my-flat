"use client";

import { C, Plastic } from "../../_shared/prims";
import { defineVariant } from "../../types";

// Local-origin flush dish; height comes only from the piece pose.
function Flush() {
  return <Plastic t="cylinder" p={[0, 0, 0]} s={[0.36, 0.015, 0.36]} c={C(0.75, 0.75, 0.78)} emissive={C(0.06, 0.055, 0.07)} />;
}

export default defineVariant({ item: "ceiling-light", id: "flush", name: "Flush dish", Component: Flush });
