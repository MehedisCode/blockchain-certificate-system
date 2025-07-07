const hre = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const institutionAddress = "0x2Dddbf2FE57800579e7139c47de588b0F918b264";

  const Institution = await hre.ethers.getContractFactory("Institution");
  const institution = await Institution.attach(institutionAddress);

  const count = await institution.getInstituteCount();
  console.log(`✅ Total Institutes: ${count}`);

  for (let i = 0; i < count; i++) {
    const address = await institution.instituteAddresses(i);

    // Call your readInstitute function here (or use getInstituteData if allowed)
    const data = await institution.readInstitute(address);

    console.log(`\n🏫 Institute ${i + 1}:`);
    console.log(`Address: ${address}`);
    console.log(`Name: ${data[0]}`);
    console.log(`Acronym: ${data[1]}`);
    console.log(`Website: ${data[2]}`);
    console.log("Courses:");
    data[3].forEach((course, index) => {
      console.log(`  - ${course.course_name}`);
    });
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
