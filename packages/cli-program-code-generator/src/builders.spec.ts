import { fileHeaders } from "./builders";

describe("fileHeaders", () => {
  describe("options.typescript = true", () => {
    const options = {
      typescript: true,
    };
    it("should return the correct string", () => {
      expect(fileHeaders(options)()).toBe('#!/usr/bin/env ts-node');
    });
  });
  describe("options.typescript = false", () => {
    const options = {
      typescript: false,
    };
    it("should return the correct string", () => {
      expect(fileHeaders(options)()).toBe('#!/usr/bin/env node');
    });
  });
});
