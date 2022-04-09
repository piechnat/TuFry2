import { App } from "./App";
import { selectDialog, showMsg } from "./dialogs";
import { Sound } from "./Sound";
import { debug, nop, rfCall } from "./utils";

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

let lastAccess = 1,
  synced = false;

self.getSyncData = () => [lastAccess, synced];
self.setSyncData = (data) => {
  if (Array.isArray(data)) {
    lastAccess = data[0];
    synced = data[1];
  }
};
self.setLastAccess = (value) => {
  const tmpVal = Math.max(1, value) || 1;
  if (tmpVal === 1) {
    synced = false;
  }
  lastAccess = value === undefined ? Date.now() : tmpVal;
};
self.getLength = () => baseList.length;
self.get = (index) => baseList[index];
self.getAbsence = (index) => ABSENCES[index];
self.remove = (index) => {
  baseList.splice(index, 1);
  self.setLastAccess();
};
self.getAll = () => baseList;

self.setAll = (list) => {
  if (Array.isArray(list) && list.length) {
    baseList.splice(0, baseList.length);
    [].push.apply(baseList, list);
  }
};

self.add = (subject, index) => {
  if (self.canAdd(subject)) {
    subject = subject.trim();
    index >= 0 && index < baseList.length ? (baseList[index] = subject) : baseList.push(subject);
    self.setLastAccess();
  }
};

self.indexOf = (subject) => {
  if (!(subject = typeof subject === "string" ? subject.trim() : "")) {
    return null;
  }
  for (let i = 0; i < baseList.length; i++) {
    if (baseList[i] === subject) {
      return i;
    }
  }
  return -1;
};

self.indexOfAbsence = (subject) => {
  if (!(subject = typeof subject === "string" ? subject.trim() : "")) {
    return null;
  }
  for (let i = 0; i < ABSENCES.length; i++) {
    if (ABSENCES[i] === subject) {
      return i;
    }
  }
  return -1;
};

self.canAdd = (subject) => self.indexOf(subject) === -1 && self.indexOfAbsence(subject) === -1;

self.dialog = (caption) => {
  if (!self.getLength()) {
    caption = ["muted", "Baza tematów jest pusta"];
  }
  return new Promise((resolve, reject) => {
    selectDialog(
      (caption ? [caption] : []).concat(self.getAll().map((subject) => ["condensed", subject]))
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

self.overwriteDialog = (subject) => {
  self
    .dialog(["caption-red", "Wybierz temat do nadpisania"])
    .then((index) => {
      self.add(subject, index);
      Sound.pop();
    })
    .catch(nop);
};

self.synchronize = (force) =>
  new Promise((resolve) => {
    if (App.loggedIn() && (!synced || force)) {
      const sendFirst = lastAccess > 1 && !synced ? baseList : null;
      synced = true;
      const closeFn = showMsg("Synchronizacja bazy tematów...", null);
      rfCall("synchronizeSubjectBase", lastAccess, sendFirst)
        .then((server) => {
          if (server.access !== lastAccess) {
            if (server.access < lastAccess) {
              return rfCall("synchronizeSubjectBase", lastAccess, baseList);
            }
            self.setLastAccess(server.access);
            self.setAll(server.result);
          }
          return server;
        })
        .catch(debug)
        .finally(() => {
          closeFn();
          resolve(true);
        });
    } else {
      resolve(false);
    }
  });

export { self as SubjectBase };
