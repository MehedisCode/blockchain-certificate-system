const fs = require("fs");
const path = require("path");

const contracts = ["Institution", "Certification"];

contracts.forEach((name) => {
  const sourcePath = path.join(
    __dirname,
    `../artifacts/contracts/${name}.sol/${name}.json`
  );
  const destPath = path.join(__dirname, `../client/src/contracts/${name}.json`);

  fs.copyFileSync(sourcePath, destPath);
  console.log(`✔ Copied ${name}.json`);
});
