const coverageFile =
  process.env.COVERAGE_LCOV_PATH ?? "coverage/lcov.info";

const minLines = Number(
  process.env.COVERAGE_MIN_LINES ?? "94.5",
);

const minFunctions = Number(
  process.env.COVERAGE_MIN_FUNCTIONS ?? "93",
);

const validateThreshold = (
  name: string,
  value: number,
): void => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(
      `Invalid ${name} coverage threshold: ${value}`,
    );
  }
};

validateThreshold("lines", minLines);
validateThreshold("functions", minFunctions);

const file = Bun.file(coverageFile);

if (!(await file.exists())) {
  console.error(`Coverage file not found: ${coverageFile}`);
  process.exit(2);
}

const content = await file.text();

let linesFound = 0;
let linesHit = 0;
let functionsFound = 0;
let functionsHit = 0;

for (const line of content.split(/\r?\n/)) {
  if (line.startsWith("LF:")) {
    linesFound += Number(line.slice(3));
    continue;
  }

  if (line.startsWith("LH:")) {
    linesHit += Number(line.slice(3));
    continue;
  }

  if (line.startsWith("FNF:")) {
    functionsFound += Number(line.slice(4));
    continue;
  }

  if (line.startsWith("FNH:")) {
    functionsHit += Number(line.slice(4));
  }
}

if (linesFound === 0) {
  console.error("LCOV contains no line coverage data.");
  process.exit(2);
}

if (functionsFound === 0) {
  console.error("LCOV contains no function coverage data.");
  process.exit(2);
}

const linesPercent =
  (linesHit / linesFound) * 100;

const functionsPercent =
  (functionsHit / functionsFound) * 100;

const linesPassed =
  linesPercent >= minLines;

const functionsPassed =
  functionsPercent >= minFunctions;

console.log("===== COVERAGE GATE =====");

console.log(
  `LINES=${linesHit}/${linesFound} ` +
    `(${linesPercent.toFixed(2)}%) ` +
    `MIN=${minLines.toFixed(2)}% ` +
    `${linesPassed ? "PASS" : "FAIL"}`,
);

console.log(
  `FUNCTIONS=${functionsHit}/${functionsFound} ` +
    `(${functionsPercent.toFixed(2)}%) ` +
    `MIN=${minFunctions.toFixed(2)}% ` +
    `${functionsPassed ? "PASS" : "FAIL"}`,
);

console.log();

if (!linesPassed || !functionsPassed) {
  console.log("COVERAGE_GATE=FAIL");
  process.exit(1);
}

console.log("COVERAGE_GATE=PASS");