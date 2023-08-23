import * as net from "net";
import { Request, Response } from "express";
import os from "os";
import { ResponseSchema } from "../SCHEMAS/ResponseSchema.schema";
import NITRO_RESPONSE from "../HELPERS/RESPONSE.HELPER";
import { ResponseMapping } from "./RESPONSE_MAPPING.UTILS";
import { Pool, Client } from "pg";
import { UTILS } from "./INDEX.UTILS";
import http from "http";

/**
 * Retrieves Application status.
 * @returns System Information if healthy.
 */

const HealthCheck = async (
  Request: Request,
  Response: Response<ResponseSchema>
) => {
  const DatabaseClient: Pool = (Request as any).DatabaseClient;

  try {
    //   await client.connect();
    const client = await DatabaseClient.connect();
    await client.query("SELECT 1");

    client.release();
    // await DatabaseClient.end();

    return NITRO_RESPONSE(Response, {
      statusCode: ResponseMapping.SUCCESSFUL.SERVER,
      status: "OK",
      results: 0,
      data: [
        {
          serverTime: new Date().toISOString(),
          database: "PostgreSQL",
          status: "Healthy",
          host: os.hostname(),
          Architecture: os.arch(),
          uptime: os.uptime(),
          network: os.networkInterfaces(),
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
          },
          cpu: os.cpus(),
          loadavg: os.loadavg(),
          rss: process.memoryUsage().rss,
        },
      ],
    });
  } catch (err: any) {
    UTILS.Logger.error(err, "HEALTH CHECH ERROR");
    return NITRO_RESPONSE(Response, {
      statusCode: 503,
      status: "Database Connection Unavailable",
      results: 0,
      data: JSON.stringify([
        {
          ...err,
          serverTime: new Date().toISOString(),
          database: "PostgreSQL",
          databaseStatus: "Inactive",
          loadAverage: os.loadavg(),
        },
      ]),
    });
  }
};

// const XYZ = () => {
// function pingServer(
//   hostname: string,
//   port: number,
//   callback: (
//     error: Error | null,
//     data: { isReachable?: boolean; latency?: number }
//   ) => void
// ): void {
//   const start = Date.now();
//   const client = net.createConnection(port, hostname);

//  client.on("connect", () => {
//     client.destroy();
//     const latency = Date.now() - start;
//     return callback(null, { isReachable: true, latency }); // Server is reachable, provide latency
//   });

//   client.on("error", (err) => {
//     callback(err, { isReachable: false, latency: 0 }); // Server is unreachable
//   });
// }

// // Usage
// pingServer("10.40.14.22", 1433, (err, data) => {
//   if (err) {
//     console.error("Error:", err);
//   } else {
//     console.log("Server is reachable:", data);
//   }
// });

// function telnetServer(
//   hostname: string,
//   port: number,
//   callback: (
//     error: Error | null,
//     data?: { isReachable: boolean; latency?: number }
//   ) => void
// ) {
//   const start = Date.now();
//   const client = net.createConnection(port, hostname);
//   let responseData = "";

//   client.on("connect", () => {
//     client.on("data", (data) => {
//       responseData += data.toString(); // Append the received data

//       // Check if the server response is complete (based on your protocol)
//       if (responseData.includes("\r\n\r\n")) {
//         console.log("Server Response:", responseData);

//         client.end(); // Close the connection after processing the response
//       }
//       const latency = Date.now() - start;
//       return callback(null, { isReachable: true, latency }); // Provide latency
//     });

//     // Send data to the server
//     client.write("GET / HTTP/1.1\r\n");
//     client.write(`Host: ${hostname}\r\n`);
//     client.write("Connection: close\r\n");
//     client.write("\r\n");
//   });

//   client.on("error", (err) => {
//     callback(err, { isReachable: false, latency: 0 });
//   });

//   client.on("close", () => {
//     callback(null);
//   });
// }

// // Usage
// telnetServer("10.40.14.22", 1433, (err, data) => {
//   if (err) {
//     console.error("Error:", err);
//   } else {
//     console.log("Telnet connection closed", data);
//   }
// });
// };

export default HealthCheck;
