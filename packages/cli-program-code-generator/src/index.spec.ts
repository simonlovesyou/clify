import type { Schema as CommandLineSchema } from "@cling/parser";
import createCli, { ParsedProgram } from ".";

const DEFAULT_PROGRAM_PARAMS = {
  async: false,
  exported: true,
  filePath: "foo.ts",
  defaultExport: true,
  internal: false,
  public: true,
  description: "String",
};

describe("single function", () => {
  describe("two required params", () => {
    const parsedProgram: ParsedProgram = [
      {
        name: "add",
        schema: {
          type: "object",
          properties: {
            numberA: {
              type: "number",
            },
            numberB: {
              type: "number",
            },
          },
          required: ["numberA", "numberB"],
        },
        ...DEFAULT_PROGRAM_PARAMS,
      },
    ];
    describe("options.positionals = false", () => {
      const options = {
        positionals: false,
      };
      it("should output the correct program", () => {
        expect(createCli(parsedProgram, options)).toMatchSnapshot();
      });
    });
    describe("options.positionals = true", () => {
      const options = {
        positionals: true,
      };
      it("should output the correct program", () => {
        expect(createCli(parsedProgram, options)).toMatchSnapshot();
      });
    });
  });
  describe("two optional params", () => {
    const parsedProgram: ParsedProgram = [
      {
        name: "add",
        schema: {
          type: "object",
          properties: {
            numberA: {
              type: "number",
            },
            numberB: {
              type: "number",
            },
          },
        },
        ...DEFAULT_PROGRAM_PARAMS,
      },
    ];
    it("should output the correct program", () => {
      expect(createCli(parsedProgram, {})).toMatchSnapshot();
    });
  });
  describe("one required param", () => {
    describe('one optional param', () => {
      const parsedProgram: ParsedProgram = [
        {
          name: "add",
          schema: {
            type: "object",
            properties: {
              numberA: {
                type: "number",
              },
              numberB: {
                type: 'number'
              }
            },
            required: ['numberA']
          },
          ...DEFAULT_PROGRAM_PARAMS,
        },
      ];
      it("should output the correct program", () => {
        expect(createCli(parsedProgram, {})).toMatchSnapshot();
      });
    })
    describe('one optional param in object', () => {
      const parsedProgram: ParsedProgram = [
        {
          name: "add",
          schema: {
            type: "object",
            properties: {
              numberA: {
                type: "number",
              },
              options: {
                type: 'object',
                properties: {
                  numberB: {
                    type: 'number'
                  }
                }
              }
            },
            required: ['numberA']
          },
          ...DEFAULT_PROGRAM_PARAMS,
        },
      ];
      it("should output the correct program", () => {
        expect(createCli(parsedProgram, {})).toMatchSnapshot();
      });
    })
  });
});
