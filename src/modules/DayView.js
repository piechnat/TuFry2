import $ from "jquery";
import { App } from "./App";
import { showMsg } from "./dialogs";
import { LessonHelper } from "./LessonHelper";
import { Sound } from "./Sound";
// import { SubjectBase } from "./SubjectBase";
import { debug, session, rfCall } from "./utils";

const self = {},
  LESSONS_CHUNK_SIZE = 3;

self.isEmpty = () => $("form.save-day div.day-view").children("div.lesson").length === 0;

self.open = () => $("form.save-day").show().find("div.day-view");

self.close = (closeIfEmpty) => {
  if (!closeIfEmpty || (closeIfEmpty && self.isEmpty())) {
    $("form.save-day").hide().find("div.day-view").empty();
    return true;
  }
  return false;
};

self.ifAllowEmpty = (str) =>
  Promise.resolve()
    .then(() => {
      if (self.isEmpty()) {
        return true;
      }
      Sound.click();
      return showMsg(str, ["OK", "Anuluj"]);
    })
    .then((result) => {
      if (result === "Anuluj") {
        return Promise.reject();
      }
      const isEmpty = result === true;
      if (!isEmpty) {
        self.close();
      }
      return isEmpty;
    });

self.removeElement = (htmlElm) => {
  Sound.pop();
  $(htmlElm)
    .closest("div.lesson")
    .slideUp("normal", function () {
      $(this).remove();
      if (self.close(true)) {
        // SubjectBase.synchronize();
      }
    });
};

function downloadLessons(lessons) {
  return new Promise((resolve, reject) => {
    let remainingLessons = lessons.length;
    let remainingLoops = Math.ceil(lessons.length / LESSONS_CHUNK_SIZE);
    const $dayView = $("form.save-day div.day-view");
    while (lessons.length) {
      const lessonsPart = lessons.splice(0, LESSONS_CHUNK_SIZE);
      const $formFragment = $("<p><i class='bx bx-loader'></i>Ładowanie...</p>");
      $dayView.append($formFragment);
      rfCall("getLessonDetails", lessonsPart)
        .then((res) => {
          remainingLessons -= res.length;
          $formFragment.replaceWith(LessonHelper.buildElements(res));
        })
        .finally(() => {
          if (--remainingLoops <= 0) {
            remainingLessons <= 0 ? resolve() : reject("Nie udało się wczytać wszystkich zajęć!");
          }
        })
        .catch((err) => $formFragment.text(err));
    }
  });
}

function uploadLessons(lessons) {
  return new Promise((resolve, reject) => {
    let remainingLessons = lessons.length;
    let remainingLoops = Math.ceil(lessons.length / LESSONS_CHUNK_SIZE);
    while (lessons.length) {
      const lessonsPart = lessons.splice(0, LESSONS_CHUNK_SIZE);
      rfCall("setDayLessons", lessonsPart)
        .then((res) => {
          res.forEach((subjectVal) => {
            self.removeElement($("input[value='" + subjectVal + "']"));
            remainingLessons--;
          });
        })
        .finally(() => {
          if (--remainingLoops <= 0) {
            remainingLessons <= 0 ? resolve() : reject("Nie udało się zapisać wszystkich zajęć!");
          }
        })
        .catch(debug);
    }
  });
}

self.download = () => {
  let closeFn = showMsg("Trwa pobieranie listy uczniów...", null);
  rfCall("getDayLessons")
    .then((res) => {
      closeFn();
      App.updateLoginForm();
      if (!res.length) {
        throw new Error("We wskazanym dniu nie ma zajęć!");
      }
      closeFn = showMsg("Trwa pobieranie tematów i&nbsp;frekwencji...", null);
      // SubjectBase.synchronize(true);
      self.open();
      return downloadLessons(res);
    })
    .finally(() => {
      closeFn();
    })
    .then(() => {
      Sound.beep();
    })
    .catch((err) => {
      Sound.click();
      return showMsg(err);
    })
    .finally(() => {
      self.close(true);
    });
};

self.upload = (lessons) => {
  const lessonsLen = lessons.length;
  if (!App.loggedIn() || !lessonsLen) {
    return false;
  }
  const closeFn = showMsg("Trwa zapisywanie zajęć (" + lessonsLen + ")", null);
  Promise.resolve()
    .then(() => {
      if (session.subjectField) {
        return uploadLessons(lessons);
      }
      return rfCall("getSubjectField", lessons[0].subjectPrms).then((res) => {
        session.subjectField = res;
        return uploadLessons(lessons);
      });
    })
    .finally(() => {
      closeFn();
    })
    .then(() => {
      Sound.beep();
      if (lessonsLen > 1) {
        showMsg("Zajęcia zostały zapisane.");
      }
    })
    .catch((err) => {
      Sound.click();
      showMsg(err);
    });
};

export { self as DayView };
