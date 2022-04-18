import { selectDialog, showMsg } from "./dialogs";
import { Sound } from "./Sound";
import { nop, rfCall } from "./utils";

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

self.download = async () => {
  try {
    return self.setItems(await rfCall("topicBaseFetch"));
  } catch (error) {
    showMsg(error);
  }
};

self.add = async (topic, subject, index) => {
  if (!self.canAdd(topic)) return;
  topic = topic.trim();
  try {
    if (index >= 0 && index < baseList.length) {
      const res = await rfCall("topicBaseUpdate", baseList[index].id, topic, subject);
      baseList[index] = res;
    } else {
      const res = await rfCall("topicBaseAdd", topic, subject);
      baseList.push(res);
    }
  } catch (error) {
    showMsg(error);
  }
};

self.remove = async (index) => {
  try {
    await rfCall("topicBaseRemove", baseList[index].id);
    baseList.splice(index, 1);
  } catch (err) {
    showMsg(err);
  }
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
