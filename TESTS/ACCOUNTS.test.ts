import { ResponseSchema } from "../SCHEMAS/ResponseSchema.schema";
import { NITRO_APP } from "../index";
import request from "supertest";

describe("Account Creation and Management", async () => {
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

  it("should create a new account", async () => {
    const response = await request(NITRO_APP)
      .get("/NITRO/API/V1/FT/INTER")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`)
      .expect("Content-Type", /json/);
    // Test account creation logic here
  });

  it("should retrieve account details", async () => {
    // Test retrieving account details logic here
  });

  it("should update account details", async () => {
    // Test updating account details logic here
  });

  it("should delete an account", async () => {
    // Test account deletion logic here
  });
});
