import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FLOORPLANS } from "@/lib/flat-plan";
import { PlanSketch } from "./PlanSketch";

describe("PlanSketch", () => {
  it("draws each catalogue plan as a labelled line diagram", () => {
    for (const choice of FLOORPLANS) {
      const plan = choice.build();
      const html = renderToStaticMarkup(<PlanSketch plan={plan} />);
      expect(html).toContain("<svg");
      expect(html).toContain(">N<");
      for (const room of plan.rooms) expect(html).toContain(room.name.split(" · ")[0]);
    }
  });
});
