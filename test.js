"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseNumber,
  computeTermByType,
  computePdDate,
  computeExpiration,
  formatDate,
  formatWarBonusText,
} = require("./calc");

test("parseNumber returns integer or null", () => {
  assert.equal(parseNumber("1977"), 1977);
  assert.equal(parseNumber(""), null);
  assert.equal(parseNumber("abc"), null);
  assert.equal(parseNumber("-12"), -12);
});

test("individual applies old/new rule and reform extension", () => {
  const result = computeExpiration({
    type: "individual",
    baseYear: 1970,
    isForeign: false,
  });
  assert.equal(result.oldExpiration, 2020);
  assert.equal(result.newExpiration, 2040);
  assert.equal(result.finalExpiration, 2040);
  assert.equal(result.pdYear, 2041);
});

test("pre-reform-expired work is not revived", () => {
  const result = computeExpiration({
    type: "corporate",
    baseYear: 1900,
    isForeign: false,
  });
  assert.equal(result.oldExpiration, 1950);
  assert.equal(result.finalExpiration, 1950);
  assert.equal(result.pdYear, 1951);
});

test("reform boundary year 2018 extends to 70 years", () => {
  const result = computeExpiration({
    type: "corporate",
    baseYear: 1968,
    isForeign: false,
  });
  assert.equal(result.oldExpiration, 2018);
  assert.equal(result.finalExpiration, 2038);
});

test("foreign logic includes war bonus line", () => {
  const result = computeExpiration({
    type: "corporate",
    baseYear: 1960,
    isForeign: true,
    warBonusDays: 3794,
  });
  assert.match(result.logic, /戦時加算日数: 3794日/);
  assert.match(formatWarBonusText(3794), /3794/);
  assert.equal(formatWarBonusText(0), "");
});

test("movie old-law individual branch uses death+38 and supports Chaplin-style date", () => {
  const result = computeExpiration({
    type: "movie",
    baseYear: 1936,
    isForeign: true,
    warBonusDays: 3794,
    movieOldLawMode: "individual",
    movieIndividualDeathYear: 1977,
  });

  assert.equal(result.oldExpiration, 2015);
  assert.equal(result.finalExpiration, 2015);
  assert.equal(result.pdDateText, "2026年05月22日");
});

test("movie old-law publication branch uses public+33", () => {
  const result = computeExpiration({
    type: "movie",
    baseYear: 1936,
    isForeign: false,
    movieOldLawMode: "publication",
  });
  assert.equal(result.oldExpiration, 1969);
  assert.equal(result.finalExpiration, 1969);
  assert.equal(result.pdDateText, "1970年01月01日");
});

test("computeTermByType throws for movie individual without death year", () => {
  assert.throws(
    () =>
      computeTermByType({
        type: "movie",
        baseYear: 1936,
        movieOldLawMode: "individual",
      }),
    /movieIndividualDeathYear/,
  );
});

test("computeExpiration throws for invalid type and negative warBonusDays", () => {
  assert.throws(
    () => computeExpiration({ type: "bad", baseYear: 2000, isForeign: false }),
    /unknown work type/,
  );
  assert.throws(
    () =>
      computeExpiration({
        type: "corporate",
        baseYear: 2000,
        isForeign: true,
        warBonusDays: -1,
      }),
    /warBonusDays/,
  );
});

test("computePdDate/formatDate edge behavior", () => {
  const basePd = computePdDate(1999, false, 3794);
  assert.equal(formatDate(basePd), "2000年01月01日");
  const withBonus = computePdDate(2015, true, 3794);
  assert.equal(formatDate(withBonus), "2026年05月22日");
});
