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

const baseList = [];

self.getAbsence = (index) => ABSENCES[index];
self.get = (index) => baseList[index].content;
self.getItems = () => baseList;
self.getLength = () => baseList.length;

self.setItems = (list) => {
  if (Array.isArray(list) && list.length) {
    baseList.splice(0, baseList.length);
    [].push.apply(baseList, list);
  }
};

self.canAdd = (topic) => self.indexOf(topic) === -1 && self.indexOfAbsence(topic) === -1;

self.indexOf = (topic) => {
  if (!(topic = typeof topic === "string" ? topic.trim() : "")) {
    return null;
  }
  for (let i = 0; i < baseList.length; i++) {
    if (baseList[i].content === topic) {
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

self.download = () => {
  rfCall("topicBaseFetch").then((res) => self.setItems(res));
};

self.add = (topic, subject, index) => {
  if (self.canAdd(topic)) {
    topic = topic.trim();
    let promise;
    if (index >= 0 && index < baseList.length) {
      promise = rfCall("topicBaseUpdate", baseList[index].id, topic, subject).then((res) => {
        baseList[index] = res;
      });
    } else {
      promise = rfCall("topicBaseAdd", topic, subject).then((res) => {
        baseList.push(res);
      });
    }
    promise.catch((err) => {
      showMsg(err);
    });
  }
};

self.remove = (index) => {
  rfCall("topicBaseRemove", baseList[index].id)
    .then((res) => {
      baseList.splice(index, 1);
    })
    .catch(debug);
};

self.dialog = (caption) => {
  if (!self.getLength()) {
    caption = ["muted", "Baza tematów jest pusta"];
  }
  return new Promise((resolve, reject) => {
    selectDialog(
      (caption ? [caption] : []).concat(
        self.getItems().map((topic) => ["condensed", topic.content])
      )
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
      self.add(topic, baseList[index].subject, index);
      Sound.pop();
    })
    .catch(nop);
};

export { self as TopicBase };
