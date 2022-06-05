import $ from "jquery";
import { App } from "./App";
import { showMsg } from "./dialogs";
import { LessonHelper } from "./LessonHelper";
import { Sound } from "./Sound";
import { TopicBase } from "./TopicBase";
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

self.isAllowEmpty = async (str) => {
  if (!self.isEmpty()) {
    Sound.click();
    if ((await showMsg(str, ["OK", "Anuluj"])) === "Anuluj") {
      return false;
    }
    self.close();
  }
  return true;
};

self.removeElement = (htmlElm) => {
  Sound.pop();
  $(htmlElm)
    .closest("div.lesson")
    .slideUp("normal", function () {
      $(this).remove();
      self.close(true);
    });
};

async function downloadLessons(lessons) {
  const promiseList = [];
  const $dayView = $("form.save-day div.day-view");
  while (lessons.length) {
    const lessonsPart = lessons.splice(0, LESSONS_CHUNK_SIZE);
    const $formFragment = $("<p><i class='bx bx-loader'></i>Ładowanie...</p>");
    $dayView.append($formFragment);
    const promise = rfCall("getLessonDetails", lessonsPart);
    promise
      .then((result) => $formFragment.replaceWith(LessonHelper.buildElements(result)))
      .catch((error) => $formFragment.text(error.message));
    promiseList.push(promise);
  }
  if ((await Promise.allSettled(promiseList)).some((result) => result.status === "rejected")) {
    throw new Error("Nie udało się wczytać wszystkich zajęć!");
  }
}

async function uploadLessons(lessons) {
  const promiseList = [];
  while (lessons.length) {
    const lessonsPart = lessons.splice(0, LESSONS_CHUNK_SIZE);
    const promise = rfCall("setDayLessons", lessonsPart);
    promise
      .then((resultList) => {
        resultList.forEach((topicVal) => {
          self.removeElement($("input[value='" + topicVal + "']"));
        });
      })
      .catch(debug);
    promiseList.push(promise);
  }
  if ((await Promise.allSettled(promiseList)).some((result) => result.status === "rejected")) {
    throw new Error("Nie udało się zapisać wszystkich zajęć!");
  }
}

self.download = async () => {
  const wasLoggedIn = App.loggedIn();
  let closeMsg = showMsg("Trwa pobieranie listy uczniów...", null);
  try {
    try {
      const result = await rfCall("getDayLessons");
      App.updateLoginForm();
      if (!wasLoggedIn) {
        TopicBase.download();
      }
      if (!result.length) {
        throw new Error("We wskazanym dniu nie ma zajęć!");
      }
      closeMsg();
      self.open();
      closeMsg = showMsg("Trwa pobieranie tematów i&nbsp;frekwencji...", null);
      await downloadLessons(result);
      Sound.beep();
    } finally {
      closeMsg();
    }
  } catch (error) {
    Sound.click();
    await showMsg(error);
    self.close(true);
  }
};

self.upload = async (lessons) => {
  const lessonsLen = lessons.length;
  if (!App.loggedIn() || !lessonsLen) {
    return false;
  }
  const closeMsg = showMsg("Trwa zapisywanie zajęć (" + lessonsLen + ")", null);
  try {
    try {
      if (!session.subjectField) {
        session.subjectField = await rfCall("getSubjectField", lessons[0].topicPrms);
      }
      await uploadLessons(lessons);
      Sound.beep();
    } finally {
      closeMsg();
    }
    if (lessonsLen > 1) {
      showMsg("Zajęcia zostały zapisane.");
    }
  } catch (error) {
    Sound.click();
    showMsg(error);
  }
};

export { self as DayView };
