import $ from "jquery";

function showMsg(str, waitFor = ["OK"]) {
  const $msgBox = (($jqElm) => {
    if ($jqElm.length) {
      return $jqElm.eq(0).stop().fadeIn(100);
    }
    return $('<div class="msg-box"/>').hide().appendTo(document.body).fadeIn(100);
  })($("body > div.msg-box"));
  const $window = $('<div class="window"/>');
  const $content = $('<div class="content"><p/></div>');
  const close = () => {
    $window.fadeOut(200, () => {
      $window.remove();
      if (!$msgBox.children("div.window").length) {
        $msgBox.fadeOut(100, () => $msgBox.remove());
      }
    });
    clearTimeout($content.data("reset-button"));
  };
  let result = close;
  if (str && str.message) {
    str = str.message;
  }
  $content.find("p").html(str);
  if (Array.isArray(waitFor) && waitFor.length > 0) {
    const $buttons = $('<p class="buttons"/>');
    result = new Promise((resolve) => {
      waitFor.forEach((button) => {
        return $buttons.append(
          $("<button/>")
            .text(button)
            .on("click", () => {
              resolve(button);
              close();
            })
        );
      });
    });
    $content.append($buttons);
  }
  if (!waitFor) {
    $content.prepend('<div class="lds-dual-ring"/>');
    $content.data(
      "reset-button",
      setTimeout(() => {
        $content.append(
          $('<p class="buttons"/>').append(
            $("<button/>")
              .text("Zresetuj aplikację!")
              .on("click", () => {
                history.back();
                window.location.reload(true);
              })
          )
        );
      }, 15000)
    );
  }
  setTimeout(() => $msgBox.append($window.append($content).hide().fadeIn(200)), 50);
  return result;
}

function selectDialog(optionsList, defIndex) {
  if (defIndex === undefined) defIndex = -1;
  return new Promise((resolve) => {
    function cancel(event) {
      resolve(defIndex);
      close(event ? 0 : 1);
    }
    const $dialog = $('<div class="selectDialog"/>');
    const $container = $('<div class="selectDialogWrapper"/>').on("click", (e) => {
      if (!$dialog.get(0).contains(e.target)) {
        cancel();
      }
    });
    function close(delay) {
      removeEventListener("popstate", cancel);
      if (delay) {
        history.back();
      }
      $container.fadeOut(delay, () => $container.remove());
    }
    const $list = $("<ul/>");
    optionsList.forEach((item, index) => {
      if (!item) {
        return;
      }
      const $item = $("<li/>");
      if (index === defIndex) {
        $item.addClass("selected");
      }
      if (Array.isArray(item)) {
        $item.addClass(item[0]);
        item = item[1];
      }
      $list.append(
        $item.html(item).on("click", () => {
          close(200);
          resolve(index);
        })
      );
    });
    setTimeout(() => {
      $container.append($dialog.append($list)).hide().appendTo(document.body).fadeIn(200);
      addEventListener("popstate", cancel);
      history.pushState({}, "");
      const selected = $("li.selected", $dialog).get(0);
      if (selected) {
        selected.scrollIntoView({ block: "center" });
      }
    }, 50);
  });
}

export { showMsg, selectDialog };
