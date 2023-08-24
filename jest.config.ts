/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

import type { Config } from "jest";

export default async (): Promise<Config> => {
  return {
    preset: "ts-jest",
    verbose: true,
    testEnvironment: "node",
    testMatch: ["**/**/*.TEST.ts"],
  };
};
