import * as fs from 'fs';
import * as path from 'path';

// Define the paths
const catalogPath = path.join(__dirname, '../docs/api-catalog.json');
const srcDir = path.join(__dirname, '../src/api');

// Load the catalog
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

// Extract all APIs and their targets
interface ApiItem {
  id: string;
  name: string;
  target: string;
  implemented: boolean;
}

const allApis: ApiItem[] = [];
catalog.categories.forEach((cat: any) => {
  cat.subcategories.forEach((sub: any) => {
    sub.apis.forEach((api: any) => {
      allApis.push({
        id: api.id,
        name: api.name,
        target: api.target,
        implemented: api.implemented
      });
    });
  });
});

// Read source files
const sourceFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts'));
let sourceCode = '';
sourceFiles.forEach(file => {
  sourceCode += fs.readFileSync(path.join(srcDir, file), 'utf-8');
});

// Check coverage
const missingTargets = new Set<string>();
const implementedButMarkedFalse: ApiItem[] = [];
const notImplementedAndMissing: ApiItem[] = [];

const uniqueTargets = new Set(allApis.map(a => a.target));
const targetCoverage: Record<string, boolean> = {};

uniqueTargets.forEach(target => {
  // Check if the target string appears in the source code (simple heuristic)
  // We look for 'target: "value"' or "target: 'value'" or just the string value in a context that looks like code
  const regex = new RegExp(`['"]${target}['"]`, 'g');
  const isCovered = regex.test(sourceCode);
  targetCoverage[target] = isCovered;
});

allApis.forEach(api => {
  const isCovered = targetCoverage[api.target];
  
  if (isCovered && !api.implemented) {
    implementedButMarkedFalse.push(api);
  } else if (!isCovered) {
    notImplementedAndMissing.push(api);
    missingTargets.add(api.target);
  }
});

// Output results
console.log(`Total APIs in Catalog: ${allApis.length}`);
console.log(`Unique Targets: ${uniqueTargets.size}`);
console.log(`\n=== Potentially Implemented but Marked False in JSON (${implementedButMarkedFalse.length}) ===`);
if (implementedButMarkedFalse.length > 0) {
    console.log(implementedButMarkedFalse.slice(0, 5).map(a => `${a.id} (${a.target})`).join('\n') + (implementedButMarkedFalse.length > 5 ? '\n...' : ''));
}

console.log(`\n=== Missing Implementation in Code (${notImplementedAndMissing.length}) ===`);
// Group by target
const missingByTarget: Record<string, string[]> = {};
notImplementedAndMissing.forEach(api => {
    if (!missingByTarget[api.target]) missingByTarget[api.target] = [];
    missingByTarget[api.target].push(api.name);
});

Object.entries(missingByTarget).forEach(([target, names]) => {
    console.log(`Target: ${target} (${names.length} APIs)`);
    // console.log(`  - ${names.join(', ')}`);
});

console.log('\n=== Summary ===');
console.log(`Covered Targets: ${Object.values(targetCoverage).filter(Boolean).length}`);
console.log(`Missing Targets: ${missingTargets.size}`);
