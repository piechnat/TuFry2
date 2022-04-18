import axios from "axios";

const session = {
  TITLE: "TurboFryderyk",
  VER: 2.0,
  domain: "psmkutno",
  cookies: {},
};

function nop() {}

function debug() {
  if (process.env.NODE_ENV === "development") {
    console.log.apply(console, arguments);
  }
}

function dateFmt(d, f) {
  if (!(d instanceof Date)) d = new Date(d);
  (function tmpFunc(c, n, l) {
    const s = (d["get" + n]() + (l || 0)).toString();
    f = f.replace(new RegExp("(^|[^$])(" + c + "+)", "g"), (m, a, b) => {
      return a + (b.replace(/./g, "0") + s).slice(-Math.max(b.length, s.length));
    });
    return tmpFunc;
  })("R", "FullYear")(
    "M",
    "Month",
    1
  )("D", "Date")("G", "Hours")("I", "Minutes")("S", "Seconds");
  const N = [
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
  const T = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
  f = f.replace(/(^|[^$])(N+)/g, (m, a) => a + N[d.getMonth()]);
  f = f.replace(/(^|[^$])(T+)/g, (m, a) => a + T[d.getDay()]);
  f = f.replace(/(\$)([^$])/g, "$2");
  return f;
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
    throw error.response ? error.response.data : error.message;
  }
}

export { session, nop, debug, dateFmt, rfCall };
