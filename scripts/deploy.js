const hre = require("hardhat");

async function main() {
  const Institution = await hre.ethers.getContractFactory("Institution");
  const institution = await Institution.deploy();
  await institution.waitForDeployment();
  console.log("Institution deployed at:", await institution.getAddress());

  const Certification = await hre.ethers.getContractFactory("Certification");
  const certification = await Certification.deploy(await institution.getAddress());
  await certification.waitForDeployment();
  console.log("Certification deployed at:", await certification.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
