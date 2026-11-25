import { describe, it, expect, beforeEach } from "vitest";

import { getRotatedModels, resetComboRotation } from "../../open-sse/services/combo.js";

describe("combo round-robin routing", () => {
  beforeEach(() => {
    resetComboRotation();
  });

  it("keeps existing one-request round-robin behavior by default", () => {
    const models = ["provider/model-a", "provider/model-b"];

    const firstChoices = Array.from({ length: 4 }, () => (
      getRotatedModels(models, "code-xhigh", "round-robin")[0]
    ));

    expect(firstChoices).toEqual([
      "provider/model-a",
      "provider/model-b",
      "provider/model-a",
      "provider/model-b",
    ]);
  });

  it("sticks to each combo model for the configured number of requests", () => {
    const models = ["provider/model-a", "provider/model-b"];

    const firstChoices = Array.from({ length: 6 }, () => (
      getRotatedModels(models, "code-xhigh", "round-robin", 2)[0]
    ));

    expect(firstChoices).toEqual([
      "provider/model-a",
      "provider/model-a",
      "provider/model-b",
      "provider/model-b",
      "provider/model-a",
      "provider/model-a",
    ]);
  });

  it("tracks sticky rotation independently per combo", () => {
    const models = ["provider/model-a", "provider/model-b"];

    expect(getRotatedModels(models, "code-high", "round-robin", 2)[0]).toBe("provider/model-a");
    expect(getRotatedModels(models, "code-xhigh", "round-robin", 2)[0]).toBe("provider/model-a");
    expect(getRotatedModels(models, "code-high", "round-robin", 2)[0]).toBe("provider/model-a");
    expect(getRotatedModels(models, "code-high", "round-robin", 2)[0]).toBe("provider/model-b");
    expect(getRotatedModels(models, "code-xhigh", "round-robin", 2)[0]).toBe("provider/model-a");
  });

  it("honors per-model weights in weighted round-robin", () => {
    const models = ["provider/model-a", "provider/model-b"];
    const weights = { "provider/model-a": 2, "provider/model-b": 1 };

    const firstChoices = Array.from({ length: 6 }, () => (
      getRotatedModels(models, "weighted-combo", "weighted-round-robin", 1, weights)[0]
    ));

    expect(firstChoices.filter((m) => m === models[0])).toHaveLength(4);
    expect(firstChoices.filter((m) => m === models[1])).toHaveLength(2);
    expect(new Set(firstChoices).size).toBe(2);
  });

  it("resets weighted rotation state with the combo", () => {
    const models = ["provider/model-a", "provider/model-b"];
    const weights = { "provider/model-a": 2, "provider/model-b": 1 };

    getRotatedModels(models, "weighted-combo", "weighted-round-robin", 1, weights);
    expect(getRotatedModels(models, "weighted-combo", "weighted-round-robin", 1, weights)[0]).toBe(models[1]);
    resetComboRotation("weighted-combo");
    expect(getRotatedModels(models, "weighted-combo", "weighted-round-robin", 1, weights)[0]).toBe(models[0]);
  });

  it("does not rotate fallback combos", () => {
    const models = ["provider/model-a", "provider/model-b"];

    expect(getRotatedModels(models, "code-xhigh", "fallback", 2)).toEqual(models);
    expect(getRotatedModels(models, "code-xhigh", "fallback", 2)).toEqual(models);
  });
});
