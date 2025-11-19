import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const beatmapsDir = path.join(__dirname, "../../public/beatmaps");

const files = fs.readdirSync(beatmapsDir).filter((f) => f.endsWith(".osz"));

fs.writeFileSync(
  path.join(beatmapsDir, "beatmaps.json"),
  JSON.stringify(files, null, 2)
);

console.log("Beatmap manifest generated:", files);
