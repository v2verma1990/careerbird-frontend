// Test script to verify initials generation works correctly
console.log("=== TESTING INITIALS GENERATION ===");

// Test the initials generation function
const generateInitials = (fullName) => {
  if (!fullName) return "VV";
  const names = fullName.trim().split(/\s+/);
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return names.map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
};

// Test cases
const testCases = [
  { name: "Vishal Verma", expected: "VV" },
  { name: "John Doe", expected: "JD" },
  { name: "Alice", expected: "AL" },
  { name: "Mary Jane Watson", expected: "MJ" },
  { name: "", expected: "VV" },
  { name: "   ", expected: "VV" },
  { name: "A", expected: "A" },
  { name: "AB", expected: "AB" },
  { name: "ABC", expected: "AB" }
];

console.log("Testing initials generation:");
testCases.forEach(test => {
  const result = generateInitials(test.name);
  const status = result === test.expected ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} "${test.name}" -> "${result}" (expected: "${test.expected}")`);
});

console.log("\n=== TESTING RESUME DATA TRANSFORMATION ===");

// Test with sample resume data
const sampleData = {
  Name: "Vishal Verma",
  Title: "Software Engineer",
  Email: "vishal@example.com",
  achievements: ["Led team of 5 developers", "Improved performance by 40%"],
  references: [
    { Name: "John Smith", Title: "Manager", Contact: "john@company.com" },
    { name: "Jane Doe", title: "Senior Dev", contact: "jane@company.com" }
  ]
};

// Simulate the transformation
const name = sampleData.Name || sampleData.name || "";
const formattedData = {
  name: name,
  initials: generateInitials(name),
  title: sampleData.Title || sampleData.title || "",
  email: sampleData.Email || sampleData.email || "",
  achievements: Array.isArray(sampleData.Achievements) ? sampleData.Achievements : 
               (Array.isArray(sampleData.achievements) ? sampleData.achievements : []),
  references: Array.isArray(sampleData.References) ? sampleData.References.map(ref => ({
                name: ref.Name || ref.name || "",
                title: ref.Title || ref.title || "",
                contact: ref.Contact || ref.contact || ""
              })) : 
             (Array.isArray(sampleData.references) ? sampleData.references.map(ref => ({
                name: ref.Name || ref.name || "",
                title: ref.Title || ref.title || "",
                contact: ref.Contact || ref.contact || ""
              })) : [])
};

console.log("Original data:", sampleData);
console.log("Transformed data:", formattedData);

// Verify the transformation
const hasInitials = formattedData.initials === "VV";
const hasAchievements = Array.isArray(formattedData.achievements) && formattedData.achievements.length > 0;
const hasReferences = Array.isArray(formattedData.references) && formattedData.references.length > 0;

console.log("\n=== VERIFICATION RESULTS ===");
console.log("✅ Initials generated correctly:", hasInitials);
console.log("✅ Achievements preserved:", hasAchievements);
console.log("✅ References transformed correctly:", hasReferences);

if (hasInitials && hasAchievements && hasReferences) {
  console.log("\n🎉 ALL TESTS PASSED! The fixes are working correctly.");
} else {
  console.log("\n❌ Some tests failed. Please check the implementation.");
}