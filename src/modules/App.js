import $ from "jquery";
import { showMsg } from "./dialogs";
import { Sound } from "./Sound";
import { session, rfCall } from "./utils";

const self = {};

self.loggedIn = () =>
  session.loggedIn &&
  session.username &&
  session.password &&
  session.domain &&
  session.cookies &&
  typeof session.cookies.CAKEPHP === "string" &&
  session.cookies.CAKEPHP.length;

self.logout = () => {
  session.cookies = {};
  session.loggedIn = undefined;
  session.subjectField = null;
};

self.showAboutInfo = () => {
  showMsg(`
    <p>
      <b>TurboFryderyk</b>, ver. ${session.VER.toFixed(2)}<br>
      <small>
        Google Web App &copy;&nbsp;${new Date().getFullYear()} 
        <a href="mailto:mpiechnat@psmkutno.pl" target="_blank">Mateusz Piechnat</a>
      </small>
    </p>
    <p>
      Aplikacja wspomagająca wypełnianie dziennika elektronicznego 
      <span class="fryderyk-full"><span class="fryderyk-logo"></span></span>, 
      dla&nbsp;nauczycieli przedmiotów indywidualnych.
    </p>
    <h4>Instalacja</h4>
    <p>
      <small>
        Upewnij się, że niniejsza strona jest otwarta w&nbsp;domyślnej przeglądarce internetu.
        <br>
        Jeśli nie widzisz dedykowanego przycisku instalacji, to z&nbsp;menu wybierz opcję 
        <em>Dodaj do ekranu głównego</em></a> (nazwa może różnić się w&nbsp;zależności 
        od używanej przeglądarki, np. w&nbsp;<em>Safari na iOS</em> należy kliknąć ikonę 
        <em>Udostępnij</em>, a&nbsp;następnie <em>Do ekranu początkowego</em>).
      </small>
    </p>
  `);
  Sound.beep(50);
  return false;
};

self.updateLoginForm = () => {
  const $openDay = $("form.open-day");
  if (self.loggedIn()) {
    $("input.username", $openDay).prop("disabled", true);
    $("button.logout", $openDay).show();
    $("button.forgot", $openDay).hide();
    $("p.password-group", $openDay).hide();
  } else {
    $("input.username", $openDay).prop("disabled", false);
    $("button.logout", $openDay).hide();
    if (session.password) {
      $("button.forgot", $openDay).show();
    } else {
      $("button.forgot", $openDay).hide();
    }
    $("p.password-group", $openDay).show();
  }
};

self.openLessonInfo = ($jqOwner, lesson) => {
  const DATA_ID = "lesson-info";
  const lessonInfo = $jqOwner.data(DATA_ID);
  const loaderId = DATA_ID + "-" + lesson.subjectPrms[0];
  const D_O = '<div style="text-align: left">',
    D_C = "</div>";
  const focus = () => $jqOwner.focus();
  if (lessonInfo) {
    showMsg(D_O + lessonInfo + D_C).then(focus);
  } else {
    showMsg(
      '<div id="' +
        loaderId +
        '"><div class="lds-dual-ring"></div>' +
        "<p>Trwa ładowanie informacji o&nbsp;przedmiocie...</p></div>"
    ).then(focus);
    rfCall("getLessonInfo", lesson.subjectPrms[0])
      .then((res) => {
        $jqOwner.data(DATA_ID, res);
        return res;
      })
      .catch((x) => x)
      .then((res) => {
        $("#" + loaderId).replaceWith(D_O + res + D_C);
      });
  }
};

self.openLastSubjects = ($jqOwner, lesson) => {
  const DATA_ID = "last-subjects";
  const lastSubjects = $jqOwner.data(DATA_ID);
  const loaderId = DATA_ID + "-" + lesson.subjectPrms[0];
  const D_O = '<div style="text-align: left">',
    D_C = "</div>";
  const focus = () => $jqOwner.focus();
  if (lastSubjects) {
    showMsg(D_O + lastSubjects + D_C).then(focus);
  } else {
    showMsg(
      '<div id="' +
        loaderId +
        '"><div class="lds-dual-ring"></div>' +
        "<p>Trwa ładowanie ostatnich tematów...</p></div>"
    ).then(focus);
    rfCall("getLastSubjects", lesson.subjectPrms[0], lesson.timePrms[0])
      .then((res) => {
        $jqOwner.data(DATA_ID, res);
        return res;
      })
      .catch((x) => x)
      .then((res) => {
        $("#" + loaderId).replaceWith(D_O + res + D_C);
      });
  }
};

export { self as App };