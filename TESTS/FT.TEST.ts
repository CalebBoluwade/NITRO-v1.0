import { ResponseSchema } from "../SCHEMAS/ResponseSchema.schema";
import { NITRO_APP } from "../index";
import request from "supertest";

describe("Edge Cases", async () => {
  const loginResponse = await request(NITRO_APP)
    .post("NITRO/API/V1/USER/AUTH/EMAIL")
    .send({
      email: "gb@hsa.com",
      password: "RangeRover1234",
      ipaddress: "127.0.0.1",
      appverion: "0.0.1",
      device: "SYS",
    })
    .expect(200);

  let authToken: string = loginResponse.body.accessToken;

  it("should handle transactions with negative amounts", async () => {
    // Test handling negative transaction amounts logic here
    const response = await request(NITRO_APP)
      .get("/NITRO/API/V1/FT/INTER")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`)
      .expect("Content-Type", /json/);
  });

  it("should handle transfers between accounts with different currencies", async () => {
    // Test handling transfers between different currency accounts logic here
  });

  it("should handle insufficient funds for transactions", async () => {
    // Test handling insufficient funds logic here
  });

  it("should handle transactions that exceed account balance limits", async () => {
    // Test handling exceeding balance limits logic here
  });

  it("should handle transactions on non-existent accounts", async () => {
    // Test handling transactions on non-existent accounts logic here
  });
});
