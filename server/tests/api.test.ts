import request from "supertest";
import { app, initDb } from "../src/index";

jest.mock("uuid", () => {
  let counter = 0;
  return { v4: () => `mock-uuid-${counter++}` };
});

jest.mock("pg", () => {
  const mPool = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

beforeAll(async () => {
  await initDb();
});

describe("A/B Testing Platform API", () => {
  it("should create a prompt and a version", async () => {
    const payload = {
      name: "test-prompt",
      systemPrompt: "You are a helpful assistant.",
      model: "gpt-4o-mini",
      temperature: 0.7,
      commitMessage: "initial"
    };
    const res = await request(app).post("/api/v1/prompts").send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("promptId");
  });
  
  it("should fetch experiments", async () => {
    const res = await request(app).get("/api/v1/experiments");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("experiments");
    expect(Array.isArray(res.body.experiments)).toBe(true);
  });
});
