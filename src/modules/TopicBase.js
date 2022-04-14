import { selectDialog } from "./dialogs";
import { Sound } from "./Sound";
import { nop } from "./utils";

const self = {};

const ABSENCES = [
  "Nieobecność",
  "Nieobecność usprawiedliwiona",
  "Nieobecność nieusprawiedliwiona",
  "Zwolnienie z zajęć",
  "Inna nieobecność",
];

const baseList = [
  "Rozczytywanie utworów",
  "Ćwiczenie zagadnień technicznych",
  "Praca nad interpretacją",
  "Pamięciowe opanowanie repertuaru",
];

self.getLength = () => baseList.length;
self.get = (index) => baseList[index];
self.getAbsence = (index) => ABSENCES[index];
self.remove = (index) => {
  baseList.splice(index, 1);
};
self.getAll = () => baseList;

self.setAll = (list) => {
  if (Array.isArray(list) && list.length) {
    baseList.splice(0, baseList.length);
    [].push.apply(baseList, list);
  }
};

self.add = (topic, index) => {
  if (self.canAdd(topic)) {
    topic = topic.trim();
    index >= 0 && index < baseList.length ? (baseList[index] = topic) : baseList.push(topic);
  }
};

self.indexOf = (topic) => {
  if (!(topic = typeof topic === "string" ? topic.trim() : "")) {
    return null;
  }
  for (let i = 0; i < baseList.length; i++) {
    if (baseList[i] === topic) {
      return i;
    }
  }
  return -1;
};

self.indexOfAbsence = (topic) => {
  if (!(topic = typeof topic === "string" ? topic.trim() : "")) {
    return null;
  }
  for (let i = 0; i < ABSENCES.length; i++) {
    if (ABSENCES[i] === topic) {
      return i;
    }
  }
  return -1;
};

self.canAdd = (topic) => self.indexOf(topic) === -1 && self.indexOfAbsence(topic) === -1;

self.dialog = (caption) => {
  if (!self.getLength()) {
    caption = ["muted", "Baza tematów jest pusta"];
  }
  return new Promise((resolve, reject) => {
    selectDialog(
      (caption ? [caption] : []).concat(self.getAll().map((topic) => ["condensed", topic]))
    ).then((index) => {
      if (caption) {
        index--;
      }
      if (index >= 0) {
        resolve(index);
      } else {
        reject();
      }
    });
  });
};

self.removeDialog = () => {
  self
    .dialog(["caption-red", "Wybierz temat do usunięcia"])
    .then((index) => {
      self.remove(index);
      Sound.pop();
    })
    .catch(nop);
};

self.overwriteDialog = (topic) => {
  self
    .dialog(["caption-red", "Wybierz temat do nadpisania"])
    .then((index) => {
      self.add(topic, index);
      Sound.pop();
    })
    .catch(nop);
};

export { self as TopicBase };
