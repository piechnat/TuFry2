import $ from "jquery";
import { App } from "./App";
import { DayView } from "./DayView";
import { selectDialog } from "./dialogs";
import { SubjectBase } from "./SubjectBase";
import { nop } from "./utils";

const self = {};

const ATTENDANCE = [
  ["bg-wild-sand muted", "Frekwencja"],
  ["bg-white-ice", "obecność"],
  ["bg-albescent", "nieobecność"],
  ["bg-rum-swizzle", "spóźnienie"],
  ["bg-frost", "nb. usprawied."],
  ["bg-cosmos", "nb. nieuspraw."],
  ["bg-mercury", "zwolnienie"],
  ["bg-link-water", "inna obecność"],
  ["bg-champagne", "inna nieobec."],
];

const ATTEND_VAL = [0, 1, 2, 5, 3, 4, 6, 7, 8];

let clipboard = "";

function _setSub(elm, subject) {
  const $lesson = $(elm).closest("div.lesson").data("subjectMod", true);
  const $textarea = $lesson.find("textarea.subject");
  setTimeout(() => {
    $(document).one("click", (e) => {
      $textarea.removeClass("manual-focus");
      if (e.target !== $textarea.get(0)) {
        $textarea.blur();
      }
    });
  }, 1);
  const prevSubject = $textarea.val();
  if (subject !== prevSubject) {
    $textarea.data("prev-subject", prevSubject).val(subject);
  }
  $textarea.addClass("manual-focus").get(0).scrollIntoView({ block: "nearest" });
  return $textarea;
}

function _setSelDlgItem($jqElm, item) {
  $jqElm.removeClass($jqElm.data("added-class"));
  if (Array.isArray(item)) {
    $jqElm.addClass(item[0]).data("added-class", item[0]);
    item = item[1];
  }
  return $jqElm.html(item);
}

function onButtonTimeClick() {
  const $button = $(this);
  const lesson = getLessonFromElement($button);
  const canSave = lesson.attendance && lesson.subject && (lesson.attendMod || lesson.subjectMod);
  selectDialog([
    ["caption-green", "Menu zajęć (" + lesson.time + ")"],
    [
      canSave ? "" : "disabled",
      "<i class='bx bx-upload'></i> Zapisz do <span class='fryderyk-logo'></span>",
    ],
    "<i class='bx bx-window-close' ></i> Zamknij bez zapisywania",
    "<i class='bx bx-info-circle' ></i> Informacje o przedmiocie",
    "<i class='bx bx-detail'></i> Ostatnie tematy",
  ]).then((index) => {
    switch (index) {
      case 1:
        if (canSave) {
          DayView.upload([lesson]);
        }
        break;
      case 2:
        DayView.removeElement($button);
        break;
      case 3:
        App.openLessonInfo($button, lesson);
        break;
      case 4:
        App.openLastSubjects($button, lesson);
        break;
    }
  });
}

function onButtonAttendanceClick() {
  const $button = $(this);
  const $input = $("input", $button.parent());
  const index = Math.max(0, ATTEND_VAL.indexOf(parseInt($input.val())));
  selectDialog(ATTENDANCE, index).then((newIndex) => {
    const attendance = ATTEND_VAL[newIndex];
    $input.val(attendance || "");
    _setSelDlgItem($button, ATTENDANCE[newIndex]);
    if (newIndex !== index) {
      switch (attendance) {
        case 2:
          _setSub($input, SubjectBase.getAbsence(0));
          break;
        case 3:
          _setSub($input, SubjectBase.getAbsence(1));
          break;
        case 4:
          _setSub($input, SubjectBase.getAbsence(2));
          break;
        case 6:
          _setSub($input, SubjectBase.getAbsence(3));
          break;
        case 8:
          _setSub($input, SubjectBase.getAbsence(4));
          break;
      }
      $button.focus().closest("div.lesson").data("attendMod", true);
    }
  });
}

function onSubjectMenuClick() {
  const I_O = ' <i class="condensed muted">',
    I_C = "</i>";
  const $textarea = $(this).closest("div.lesson").find("textarea");
  const subject = $textarea.val(),
    prevSubject = $textarea.data("prev-subject");
  const canCopy = subject.length && subject !== clipboard,
    canPaste = clipboard.length && clipboard !== subject,
    canAdd = SubjectBase.canAdd(subject),
    canOverwrite = canAdd && SubjectBase.getLength();
  selectDialog([
    ["caption-green", "Menu tematu"],
    [canCopy ? "" : "disabled", "<i class='bx bx-copy-alt lg'></i> Kopiuj" + I_O + subject + I_C],
    [canAdd ? "" : "disabled", "<i class='bx bx-layer-plus lg'></i> Dodaj do bazy"],
    [canOverwrite ? "" : "disabled", "<i class='bx bx-layer lg'></i> Nadpisz w bazie..."],
    [prevSubject ? "" : "disabled", "<i class='bx bx-undo lg'></i> Przywróć poprzedni"],
    [canPaste ? "" : "disabled", "<i class='bx bx-paste lg'></i> Wklej" + I_O + clipboard + I_C],
    "<i class='bx bx-import lg'></i> Wklej z bazy...",
  ]).then((index) => {
    switch (index) {
      case 1:
        if (canCopy) {
          clipboard = subject;
        }
        break;
      case 2:
        if (canAdd) {
          SubjectBase.add(subject);
        }
        break;
      case 3:
        if (canOverwrite) {
          SubjectBase.overwriteDialog(subject);
        }
        break;
      case 4:
        if (prevSubject) {
          _setSub($textarea, prevSubject);
        }
        break;
      case 5:
        if (canPaste) {
          _setSub($textarea, clipboard);
        }
        break;
      case 6:
        onPasteIconClick.call($textarea.get(0));
        break;
    }
  });
}

function onPasteIconClick() {
  const $lesson = $(this).closest("div.lesson");
  const caption = "Wklej temat zajęć (" + $("input[name='time']", $lesson).val() + ")";
  SubjectBase.dialog(["caption-green", caption])
    .then((index) => {
      _setSub($lesson, SubjectBase.get(index));
    })
    .catch(nop);
}

function getLessonFromElement(htmlElm) {
  htmlElm = $(htmlElm).closest("div.lesson");
  return {
    subjectMod: htmlElm.data("subjectMod"),
    attendMod: htmlElm.data("attendMod"),
    subjectPrms: $("[name='subjectPrms']", htmlElm).val().split("|"),
    timePrms: $("[name='timePrms']", htmlElm).val().split("|"),
    time: $("[name='time']", htmlElm).val(),
    studentName: $("[name='studentName']", htmlElm).val(),
    name: $("[name='name']", htmlElm).val(),
    attendPrms: $("[name='attendPrms']", htmlElm).val().split("|"),
    attendance: $("[name='attendance']", htmlElm).val(),
    subject: $("[name='subject']", htmlElm).val(),
  };
}

function _buildNavigationBar(lesson) {
  return $("<div/>", { class: "nav" }).append([
    $("<button/>", { type: "button", class: "time bg-wild-sand" })
      .text(lesson.time)
      .on("click", onButtonTimeClick),
    $("<div/>", { class: "attendance" }).append([
      $("<input/>", {
        name: "attendance",
        value: parseInt(lesson.attendance) || "",
        required: true,
        tabindex: -1,
        maxlength: 0,
        autocomplete: "off",
      }).focus(function () {
        $("button", $(this).parent()).focus();
      }),
      _setSelDlgItem(
        $("<button/>", { type: "button", class: "attendance bg-white" }).on(
          "click",
          onButtonAttendanceClick
        ),
        ATTENDANCE[Math.max(0, ATTEND_VAL.indexOf(parseInt(lesson.attendance)))]
      ),
    ]),
    $("<button/>", { type: "button", class: "name bg-white" })
      .append([
        $("<div>", { class: "menu-icon" }).html("<i class='bx bx-menu lg' ></i>"),
        $("<b/>").text(lesson.studentName),
        document.createTextNode(" "),
        $("<span/>", { class: "smaller" }).text(lesson.name),
      ])
      .on("click", onSubjectMenuClick),
  ]);
}

self.buildElements = function (lessons) {
  return lessons.map((lesson, index) => {
    return $("<div>", { class: "lesson" })
      .append([
        $("<input/>", { type: "hidden", name: "subjectPrms", value: lesson.subjectPrms.join("|") }),
        $("<input/>", { type: "hidden", name: "timePrms", value: lesson.timePrms.join("|") }),
        $("<input/>", { type: "hidden", name: "time", value: lesson.time }),
        $("<input/>", { type: "hidden", name: "studentName", value: lesson.studentName }),
        $("<input/>", { type: "hidden", name: "name", value: lesson.name }),
        $("<input/>", { type: "hidden", name: "attendPrms", value: lesson.attendPrms.join("|") }),
        _buildNavigationBar(lesson),
        $("<textarea/>", {
          class: "subject condensed",
          name: "subject",
          placeholder: "Wprowadź temat zajęć",
          required: true,
          rows: 2,
        })
          .text(lesson.subject)
          .on("focus", function () {
            $(this)
              .css({ height: "6.7em" })
              .closest(".day-view")
              .find("textarea")
              .not(this)
              .css({ height: "3.6em" });
          })
          .on("blur", function () {
            const $textarea = $(this),
              $lesson = $textarea.closest("div.lesson");
            const $input = $(".attendance input", $lesson);
            if (!parseInt($input.val()) && SubjectBase.indexOfAbsence($textarea.val()) === -1) {
              $input.val(1);
              _setSelDlgItem($(".attendance button", $lesson), ATTENDANCE[1]);
              $lesson.data("attendMod", true);
            }
          })
          .one("input", function () {
            $(this).closest("div.lesson").data("subjectMod", true);
          }),
        $("<button>", { class: "paste-icon", type: "button" })
          .html("<i class='bx bx-import lg'></i>")
          .on("click", onPasteIconClick),
      ])
      .data("subjectMod", lesson.subjectMod)
      .data("attendMod", lesson.attendMod);
  });
};

self.collectLessons = (filterForSaving) => {
  const lessons = [];
  let filterRejection = false;
  $("form.save-day div.lesson").each(function () {
    const lesson = getLessonFromElement(this);
    if (filterForSaving) {
      if (!(lesson.attendance && lesson.subject)) {
        // skip not filled
        return;
      }
      if (!(lesson.attendMod || lesson.subjectMod)) {
        // skip and remove not modified
        filterRejection = true;
        return DayView.removeElement(this);
      }
    }
    lessons.push(lesson);
  });
  if (filterForSaving) {
    return lessons.length || filterRejection ? lessons : null;
  }
  return lessons;
};

export { self as LessonHelper };
