"use strict";

const REFORM_YEAR = 2018;

function parseNumber(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}年${m}月${d}日`;
}

function computePdDate(finalExpirationYear, isForeign, warBonusDays) {
  const base = new Date(Date.UTC(finalExpirationYear + 1, 0, 1));
  if (isForeign && warBonusDays > 0) {
    const result = new Date(base);
    result.setUTCDate(result.getUTCDate() + warBonusDays);
    return result;
  }
  return base;
}

function computeTermByType(input) {
  const { type, baseYear, movieOldLawMode, movieIndividualDeathYear } = input;

  if (!Number.isInteger(baseYear)) {
    throw new Error("baseYear must be an integer");
  }

  if (type === "individual") {
    return {
      title: "個人著作物",
      oldExpiration: baseYear + 50,
      newExpiration: baseYear + 70,
      oldLabel: "旧法: 死後50年",
      newLabel: "新法: 死後70年",
    };
  }

  if (type === "movie") {
    if (movieOldLawMode === "individual") {
      if (!Number.isInteger(movieIndividualDeathYear)) {
        throw new Error(
          "movieIndividualDeathYear is required for movie individual mode",
        );
      }
      return {
        title: "映画の著作物（実名の個人名義）",
        oldExpiration: movieIndividualDeathYear + 38,
        newExpiration: baseYear + 70,
        oldLabel: "旧法: 死後38年",
        newLabel: "新法: 公表後70年",
      };
    }

    return {
      title: "映画の著作物（団体名義等）",
      oldExpiration: baseYear + 33,
      newExpiration: baseYear + 70,
      oldLabel: "旧法: 公表後33年",
      newLabel: "新法: 公表後70年",
    };
  }

  return {
    title: "公表基準著作物",
    oldExpiration: baseYear + 50,
    newExpiration: baseYear + 70,
    oldLabel: "旧法: 公表後50年",
    newLabel: "新法: 公表後70年",
  };
}

function computeExpiration(input) {
  const {
    type,
    baseYear,
    isForeign,
    warBonusDays = 0,
    movieOldLawMode = "publication",
    movieIndividualDeathYear = null,
  } = input;
  if (!["individual", "corporate", "movie", "anonymous"].includes(type)) {
    throw new Error("unknown work type");
  }
  if (!Number.isInteger(warBonusDays) || warBonusDays < 0) {
    throw new Error("warBonusDays must be a non-negative integer");
  }
  const term = computeTermByType({
    type,
    baseYear,
    movieOldLawMode,
    movieIndividualDeathYear,
  });

  let logic = "";
  logic += `${term.title}\n`;
  logic += `${term.oldLabel} → ${term.oldExpiration}年末\n`;
  logic += `${term.newLabel} → ${term.newExpiration}年末\n\n`;

  const finalExpiration =
    term.oldExpiration >= REFORM_YEAR ? term.newExpiration : term.oldExpiration;

  if (term.oldExpiration >= REFORM_YEAR) {
    logic += `2018年改正時点で著作権存続中。\n`;
    logic += `→ 70年へ延長適用。\n`;
  } else {
    logic += `2018年改正前に既に消滅済み。\n`;
    logic += `→ 著作権は復活しない。\n`;
  }

  if (isForeign) {
    logic += `\n外国著作物\n`;
    logic += `戦時加算日数: ${warBonusDays}日\n`;
  }

  const pdDate = computePdDate(finalExpiration, isForeign, warBonusDays);
  return {
    oldExpiration: term.oldExpiration,
    newExpiration: term.newExpiration,
    finalExpiration,
    pdYear: finalExpiration + 1,
    pdDate,
    pdDateText: formatDate(pdDate),
    logic,
  };
}

function formatWarBonusText(warBonusDays) {
  if (warBonusDays > 0) {
    return (
      `さらに戦時加算 ${warBonusDays} 日を加味する必要があります。<br>` +
      `（厳密には日単位計算が必要）`
    );
  }
  return "";
}

const api = {
  REFORM_YEAR,
  parseNumber,
  computeTermByType,
  computePdDate,
  computeExpiration,
  formatDate,
  formatWarBonusText,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}

if (typeof window !== "undefined") {
  window.CopyrightCalc = api;
}
