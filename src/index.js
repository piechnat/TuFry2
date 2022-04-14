import $ from "jquery";
import body from "./body.html";
import "./layout.css";
import "./style.css";
import { dateFmt, nop, session } from "./modules/utils";
import { showMsg } from "./modules/dialogs";
import { App } from "./modules/App";
import { TopicBase } from "./modules/TopicBase";
import { Sound } from "./modules/Sound";
import { LessonHelper } from "./modules/LessonHelper";
import { DayView } from "./modules/DayView";

if (window.JSON && !window.JSON.dateParser) {
  JSON.dateParser = (key, value) => {
    const re = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
    if (typeof value === "string" && re.exec(value)) {
      return new Date(value);
    }
    return value;
  };
}

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

$(document.body).html(body);

$("#copyright span.date").html(new Date().getFullYear());

$("form").on("submit", function (e) {
  e.preventDefault();
  if (!this.checkValidity()) {
    try {
      this.reportValidity();
    } catch (e) {}
  }
  return false;
});

$(".about-info").on("click", App.showAboutInfo);

$("form.open-day button.forgot").on("click", () => {
  Sound.pop();
  App.logout();
  session.username = session.password = null;
  $("form.open-day input.username, form.open-day input.password").val("");
  App.updateLoginForm();
});

$("form.open-day button.logout").on("click", () => {
  DayView.ifAllowEmpty("Niezapisane zmiany zostaną utracone! Czy na pewno chcesz się wylogować?")
    .then((wasEmpty) => {
      if (!wasEmpty) {
        // return TopicBase.synchronize();
      }
    })
    .then(() => {
      App.logout();
      App.updateLoginForm();
    })
    .catch(nop);
});

$("form.open-day").on("submit", function () {
  const form = this;
  DayView.ifAllowEmpty(
    "Niezapisane zmiany zostaną utracone! Czy na pewno chcesz wczytać nowy dzień?"
  )
    .then(() => {
      if (!App.loggedIn()) {
        const login = form.username.value.split("@", 2).map((s) => s.trim());
        if (login[1]) {
          session.domain = login[1];
        }
        $("form.open-day i.domain").text(session.domain);
        form.username.value = session.username = login[0];
        form.password.value = session.password = form.password.value.trim();
      }
      session.strdate = form.date.value;
      DayView.download();
    })
    .catch(nop);
});

$("form.save-day button.save").on("click", () => {
  const lessons = LessonHelper.collectLessons(true);
  if (lessons) {
    DayView.upload(lessons);
  } else {
    Sound.click();
    showMsg("Aby zapisać zajęcia, należy wprowadzić temat i frekwencję!");
  }
});

$("form.save-day button.close").on("click", () => {
  DayView.ifAllowEmpty("Niezapisane zmiany zostaną utracone! Czy na pewno chcesz zamknąć dzień?")
    .then((wasEmpty) => {
      if (!wasEmpty) {
        // return TopicBase.synchronize();
      }
    })
    .catch(nop);
});

$("form.save-day button.topic-base-remove").on("click", TopicBase.removeDialog);

function onLoadData(str) {
  const obj = {};
  try {
    Object.assign(obj, JSON.parse(str, JSON.dateParser));
  } catch (e) {}
  if (!obj.session) {
    obj.session = {};
  }
  if (session.VER > (obj.session.VER || 0)) {
    obj.session.VER = session.VER;
    App.showAboutInfo();
  }
  Object.assign(session, obj.session);
  TopicBase.setAll(obj.topics);
  if (typeof obj.soundEnabled === "boolean") {
    Sound.enabled = obj.soundEnabled;
  }
  $("#copyright .sound-icon")
    .on("click", function (e) {
      if (!e.isTrigger) {
        Sound.enabled = !Sound.enabled;
        if (Sound.enabled) {
          Sound.pop();
        }
      }
      $(this).html(`<i class="bx bxs-volume-${Sound.enabled ? "full" : "mute"}"></i>`);
    })
    .trigger("click");
  const $openDay = $("form.open-day");
  $("i.domain", $openDay).text(session.domain);
  $("input.username", $openDay).val(session.username || "");
  $("input.password", $openDay).val(session.password || "");
  App.updateLoginForm();
  if (obj.lastDay === new Date().getDate() && session.strdate) {
    $("input.date", $openDay).val(dateFmt(session.strdate, "RRRR-MM-DD"));
    if (obj.lessons && obj.lessons.length && App.loggedIn()) {
      DayView.open().empty().append(LessonHelper.buildElements(obj.lessons));
    }
  } else {
    $("input.date", $openDay).val(dateFmt(new Date(), "RRRR-MM-DD"));
  }
  $("#loading").fadeTo(200, 1).parent().addClass("violet-shadow");
}

onLoadData(localStorage.getItem("DATA"));

function onSaveData() {
  const str = JSON.stringify({
    session: session,
    lastDay: new Date().getDate(),
    lessons: LessonHelper.collectLessons(),
    topics: TopicBase.getAll(),
    soundEnabled: Sound.enabled,
  });
  localStorage.setItem("DATA", str);
}

addEventListener("beforeunload", onSaveData);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    onSaveData();
  }
  if (document.visibilityState === "visible") {
    Sound.setup();
  }
});

addEventListener("load", () => {
  history.pushState({}, "");
});

$(document.body).on("touchstart.gstr touchend.gstr mousedown.gstr keydown.gstr", function (e) {
  Sound.setup();
  $(this).off(".gstr");
});

addEventListener("popstate", (event) => {
  if (!event.state) {
    onSaveData();
    const closeFn = showMsg("Naciśnij ponownie <i>Wstecz</i>, aby wyjść.", []);
    setTimeout(() => {
      closeFn();
      history.pushState({}, "");
    }, 800);
  }
});
