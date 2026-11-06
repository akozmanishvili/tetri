import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

let token: string;
let userId: string;

beforeEach(async () => {
  await prisma.toast.deleteMany({
    where: { conceptKey: { startsWith: "test_" } },
  });
  await prisma.toast.createMany({
    data: [
      {
        conceptKey: "test_concept",
        titleKa: "ტ",
        titleEn: "T",
        bodyKa: "ბ",
        bodyEn: "B",
      },
      {
        conceptKey: "test_hidden",
        titleKa: "ტ",
        titleEn: "T",
        bodyKa: "ბ",
        bodyEn: "B",
        isActive: false,
      },
    ],
  });

  const res = await request(app).post("/api/auth/signup").send({
    email: "guest@tetri.ge",
    password: "supersecret123",
    displayName: "Guest",
  });
  token = res.body.accessToken;
  userId = res.body.user.id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("unlocking toasts", () => {
  it("returns the toast the first time only", async () => {
    const first = await request(app)
      .post("/api/toasts/test_concept/unlock")
      .set(auth());
    expect(first.body.toast.titleEn).toBe("T");

    const second = await request(app)
      .post("/api/toasts/test_concept/unlock")
      .set(auth());
    expect(second.body.toast).toBeNull();
  });

  it("lets exactly one of two simultaneous unlocks win", async () => {
    const results = await Promise.all([
      request(app).post("/api/toasts/test_concept/unlock").set(auth()),
      request(app).post("/api/toasts/test_concept/unlock").set(auth()),
    ]);
    expect(results.filter((r) => r.body.toast !== null)).toHaveLength(1);
  });

  it("returns 404 for unknown concepts and null for inactive ones", async () => {
    const unknown = await request(app)
      .post("/api/toasts/test_nope/unlock")
      .set(auth());
    expect(unknown.status).toBe(404);

    const hidden = await request(app)
      .post("/api/toasts/test_hidden/unlock")
      .set(auth());
    expect(hidden.body.toast).toBeNull();
  });

  it("lists what the user has unlocked", async () => {
    await request(app).post("/api/toasts/test_concept/unlock").set(auth());
    const res = await request(app).get("/api/toasts/unlocked").set(auth());
    expect(
      res.body.toasts.map((t: { conceptKey: string }) => t.conceptKey),
    ).toContain("test_concept");
  });
});

describe("admin", () => {
  const newToast = {
    conceptKey: "test_admin",
    titleKa: "ტ",
    titleEn: "T",
    bodyKa: "ბ",
    bodyEn: "B",
  };

  it("refuses normal users", async () => {
    const res = await request(app)
      .post("/api/admin/toasts")
      .set(auth())
      .send(newToast);
    expect(res.status).toBe(403);
  });

  it("lets admins create and edit toasts, and rejects duplicate keys", async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });

    const created = await request(app)
      .post("/api/admin/toasts")
      .set(auth())
      .send(newToast);
    expect(created.status).toBe(201);

    const duplicate = await request(app)
      .post("/api/admin/toasts")
      .set(auth())
      .send(newToast);
    expect(duplicate.status).toBe(409);

    const edited = await request(app)
      .patch(`/api/admin/toasts/${created.body.id}`)
      .set(auth())
      .send({ titleEn: "Edited" });
    expect(edited.body.titleEn).toBe("Edited");
    expect(edited.body.isActive).toBe(true);
  });
});
