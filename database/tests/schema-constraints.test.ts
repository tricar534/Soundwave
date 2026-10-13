import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const schema = readFileSync(
  new URL("../prisma/schema.prisma", import.meta.url),
  "utf8"
);

function getModel(name: string): string {
  const match = schema.match(
    new RegExp(`model\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`)
  );

  assert.ok(match, `Model ${name} should exist`);
  return match[1];
}

test("Genre names must be unique", () => {
  const genre = getModel("Genre");

  assert.match(
    genre,
    /name\s+String\s+@unique/,
    "Genre.name must have a unique constraint"
  );
});

test("Media file paths must be unique", () => {
  const mediaFile = getModel("MediaFile");

  assert.match(
    mediaFile,
    /filePath\s+String\s+@unique/,
    "MediaFile.filePath must have a unique constraint"
  );
});