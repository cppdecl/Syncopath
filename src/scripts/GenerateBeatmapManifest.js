const fs = require("fs");
const path = require("path");

const beatmapsDir = path.join(__dirname, "../../", "public", "beatmaps");
const files = fs.readdirSync(beatmapsDir).filter((f) => f.endsWith(".osz"));

fs.writeFileSync(
  path.join(beatmapsDir, "beatmaps.json"),
  JSON.stringify(files, null, 2)
);

console.log("Beatmap manifest generated:", files);
