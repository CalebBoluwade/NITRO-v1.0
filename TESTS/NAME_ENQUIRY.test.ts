import { ResponseSchema } from "../SCHEMAS/ResponseSchema.schema";
import { NITRO_APP } from "../index";
import request from "supertest";

describe("GET api/v1/NE  NAME ENQUIRY", () => {
  it("SHOULD RETURN ACCOUNT DETAILS OR NULL IF NOT FOUND", async () => {
    const response = await request(NITRO_APP)
      .get("/ft/name_enquiry/000/2333333334")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual<ResponseSchema>({
      results: 1,
      status: "SUCCESSFUL",
      statusCode: 200,
      data: [
        {
          accountname: "BOLUWADE",
          bvn: 11111111111,
          bankcode: "000",
          bankname: "...",
          sessionid: "00000000000000000000000000000",
          status: "00",
          statusmessage: "TESTING",
          accountno: "2333333334",
        },
      ],
    });
  });
});
