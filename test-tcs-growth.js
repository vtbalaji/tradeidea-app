// Test TCS Growth Score Calculation
// Based on the screenshots provided

const tcsData = {
  // From screenshot 2
  earningsQuarterlyGrowth: 1.40,  // Very low
  earningsGrowth: 1.40,           // Very low
  revenueGrowth: 2.40,            // Very low

  // From screenshot 1 - need for technical check
  currentPrice: 2962,
  changePercent: 0  // We don't have this from screenshots, assume 0
};

console.log("=== TCS GROWTH SCORE CALCULATION ===\n");

console.log("Growth Score Criteria (need at least 3 of 4):");
console.log("-----------------------------------------------");

const criteria = [
  {
    name: "earningsGrowth >= 15%",
    value: tcsData.earningsGrowth,
    threshold: 15,
    passes: tcsData.earningsGrowth >= 15
  },
  {
    name: "earningsQuarterlyGrowth >= 12%",
    value: tcsData.earningsQuarterlyGrowth,
    threshold: 12,
    passes: tcsData.earningsQuarterlyGrowth >= 12
  },
  {
    name: "revenueGrowth >= 8%",
    value: tcsData.revenueGrowth,
    threshold: 8,
    passes: tcsData.revenueGrowth >= 8
  },
  {
    name: "changePercent > 0",
    value: tcsData.changePercent,
    threshold: 0,
    passes: tcsData.changePercent > 0
  }
];

let passCount = 0;
criteria.forEach((c, i) => {
  const status = c.passes ? "✓ PASS" : "✗ FAIL";
  console.log(`${i + 1}. ${c.name}`);
  console.log(`   Value: ${c.value}%, Threshold: ${c.threshold}%`);
  console.log(`   ${status}\n`);
  if (c.passes) passCount++;
});

console.log("-----------------------------------------------");
console.log(`Growth Score: ${passCount}/4`);
console.log(`Required: 3/4`);
console.log(`Growth Condition Met: ${passCount >= 3 ? "YES ✓" : "NO ✗"}`);

console.log("\n=== ANALYSIS ===");
console.log("\nWhy TCS failed the growth score:");
console.log("1. Earnings Growth (1.40%) << 15% threshold");
console.log("2. Quarterly Earnings Growth (1.40%) << 12% threshold");
console.log("3. Revenue Growth (2.40%) << 8% threshold");
console.log("4. Price change is not positive");
console.log("\nResult: 0/4 conditions met (need 3/4)");

console.log("\n=== DATA FROM SCREENSHOTS ===");
console.log("Image 1 (Screener.in):");
console.log("- QoQ Profits: -5.37%");
console.log("- QoQ Sales: 3.72%");
console.log("- Sales growth 3Years: 10.0%");
console.log("\nImage 2 (Your system):");
console.log("- earnings Quarterly Growth: 1.40%");
console.log("- earnings Growth: 1.40%");
console.log("- revenue Growth: 2.40%");
console.log("\nNote: The low growth numbers reflect TCS's recent performance,");
console.log("which is why the growth score correctly shows 0/4.");
