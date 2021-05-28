#!/usr/bin/env ts-node

import cling from "@cling/cling";
import { default as add } from "/Users/simon.johansson/repos/clify/packages/clify/examples/add";

try {
  const programSchema = {
    positionals: [
      {
        type: "number",
        description: "First number",
      },
      {
        type: "number",
        description: "Second number",
      },
    ],
  } as const;

  const { positionals } = cling(programSchema, {});

  const result = add.apply(null, [positionals["0"], positionals["1"]]);

  console.log(result);
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}