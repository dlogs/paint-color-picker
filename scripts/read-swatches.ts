import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseAse, type AseEntry } from "../src/util/ase-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASE_DIR = path.resolve(__dirname, "..", "ase-files");

function parseFilename(filename: string): { retrievalDate: string; collection: string } {
  const base = filename.replace(/\.ase$/i, "");
  const match = base.match(/^(\d{4}_\d{2}_\d{2})_(.+)$/);
  if (!match) return { retrievalDate: "", collection: base.replace(/_/g, " ") };
  return {
    retrievalDate: match[1].replace(/_/g, "-"),
    collection: match[2].replace(/_/g, " "),
  };
}

function readCollectionAseFile(brandDir: string, filename: string) {
  const { retrievalDate, collection } = parseFilename(filename);
  console.log(`  Parsing: ${filename} → "${collection}" (${retrievalDate})`);
  try {
    const buf = fs.readFileSync(path.join(ASE_DIR, brandDir, filename));
    const colors = parseAse(buf.buffer);
    console.log(`    → ${colors.length} colors`);
    return colors;
  } catch (err) {
    console.error(`    ERROR: ${(err as Error).message}`);
    return [];
  }
}

function readBrandDir(brandDir: string) {
  const brand = brandDir.replace(/_/g, " ");
  const brandPath = path.join(ASE_DIR, brandDir);
  const aseFiles = fs.readdirSync(brandPath).filter((f) => f.toLowerCase().endsWith(".ase"));
  const allColors: AseEntry[] = [];

  for (const filename of aseFiles) {
    const colors = readCollectionAseFile(brandDir, filename);
    allColors.push(...colors);
  }
  console.log(`Brand: ${brand} (${allColors.length} colors)`);
}

function main() {
  const brandDirs = fs
    .readdirSync(ASE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const brandDir of brandDirs) {
    readBrandDir(brandDir);
  }

  //readCollectionAseFile('Sherwin_Williams/2026_02_22_Designer_Color_Collection.ase')
}

main();
