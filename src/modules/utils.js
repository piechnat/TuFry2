import axios from "axios";

const pckgJson = require("../../package.json");

const session = {
  TITLE: pckgJson.appName,
  VER: pckgJson.version,
  domain: "psmkutno",
  cookies: {},
};

function nop() {}

function debug() {
  if (process.env.NODE_ENV === "development") {
    console.log.apply(console, arguments);
  }
}

const dayT = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

const monthN = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

function dateFmt(date, formatStr) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  // parse function
  function pf(formatChar, dateFuncName, indexShift = 0) {
    const resultVal = (date["get" + dateFuncName]() + indexShift).toString();
    formatStr = formatStr.replace(
      new RegExp("(^|[^$])(" + formatChar + "+)", "g"),
      (match, p1, p2) =>
        p1 + (p2.replace(/./g, "0") + resultVal).slice(-Math.max(p2.length, resultVal.length))
    );
    return pf;
  }
  pf("R", "FullYear")("M", "Month", 1)("D", "Date")("G", "Hours")("I", "Minutes")("S", "Seconds");
  return formatStr
    .replace(/(^|[^$])(N+)/g, (m, a) => a + monthN[date.getMonth()])
    .replace(/(^|[^$])(T+)/g, (m, a) => a + dayT[date.getDay()])
    .replace(/(\$)([^$])/g, "$2");
}

/* Example of usage: dateFmt(new Date(), "T, D. N (DD-MM-RRRR), $Godzina GG:II:SS") */

const rfcServiceUrl = window.location.protocol + "//" + window.location.hostname + "/rfcservice";

async function rfCall() {
  const args = [].slice.call(arguments);
  try {
    const response = await axios.post(rfcServiceUrl, {
      fname: args.shift(),
      args: args,
      session: session,
    });
    Object.assign(session, response.data.session);
    return response.data.value;
  } catch (error) {
    if (error.response) {
      error.message = error.response.data;
    }
    throw error;
  }
}

export { session, nop, debug, dateFmt, rfCall };
