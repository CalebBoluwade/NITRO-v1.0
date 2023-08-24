import { Application } from "express";
import { ResponseSchema } from "../SCHEMAS/ResponseSchema.schema";
import { NITRO_APP } from "../index";
import request from "supertest";
import { UTILS } from "../UTILS/INDEX.UTILS";
import { ResponseMapping } from "../UTILS/RESPONSE_MAPPING.UTILS";

describe("Edge Cases", () => {
  let authToken: string = "";
  const API = request(NITRO_APP);

  it("Login User", async () => {
    const loginResponse = await API.post("/NITRO/API/V1/USER/AUTH/EMAIL").send({
      email: "gb@hsa.com",
      password: "RangeRover1234",
      ipaddress: "127.0.0.1",
      appverion: "0.0.1",
      device: "SYS",
    });

    expect(loginResponse.statusCode).toBe(200);

    authToken = loginResponse.body.data[0].accessToken;
  });

  it("should handle transactions with negative amounts", async () => {
    const API = request(NITRO_APP);
    // Test handling negative transaction amounts logic here
    const response = await API.post("/NITRO/API/V1/FT/INTER")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`)
      .expect("Content-Type", /json/)
      .send({
        RequestID: UTILS.GetUUID(),
        Source: "MOBILEv1",
        CreditAccountNo: "7245667984",
        CreditInstitutionCode: "000000",
        DebitAccountNo: "7657890295",
        CreditAccountName: "John Doe",
        Amount: -100.0,
        Beneficiary: false,
        AuthPIN: "555544",
        TransactionLocation: {
          latitude: 5.754,
          longitude: 5.3567,
        },
      });

    console.log(response.body);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual<ResponseSchema>({
      results: 0,
      status: ResponseMapping.INVALID_REQUEST.MESSAGE,
      statusCode: ResponseMapping.INVALID_REQUEST.SERVER,
      data: null,
    });
  });

  it("should handle transfers between accounts with different currencies", async () => {
    // Test handling transfers between different currency accounts logic here
  });

  it("should handle insufficient funds for transactions", async () => {
    const API = request(NITRO_APP);
    // Test handling insufficient funds logic here
    const response = await API.post("/NITRO/API/V1/FT/INTER")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${authToken}`)
      .expect("Content-Type", /json/)
      .send({
        RequestID: UTILS.GetUUID(),
        Source: "MOBILEv1",
        CreditAccountNo: "7245667984",
        CreditInstitutionCode: "000000",
        DebitAccountNo: "7657890295",
        CreditAccountName: "John Doe",
        Amount: 5000000.0,
        Beneficiary: false,
        AuthPIN: "555544",
        TransactionLocation: {
          latitude: 5.754,
          longitude: 5.3567,
        },
      });

    console.log(response.body);

    expect(response.statusCode).toBe(ResponseMapping.INSUFFICIENT_FUNDS.SERVER);
    expect(response.body).toEqual<ResponseSchema>({
      results: 1,
      status: ResponseMapping.INSUFFICIENT_FUNDS.MESSAGE,
      statusCode: ResponseMapping.INSUFFICIENT_FUNDS.SERVER,
      data: response.body.data,
    });
  });

  it("should handle transactions that exceed account balance limits", async () => {
    // Test handling exceeding balance limits logic here
  });

  it("should handle transactions on non-existent accounts", async () => {
    // Test handling transactions on non-existent accounts logic here
  });
});
