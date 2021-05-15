config.app.listeners = {
  "add": function () {
    var url = document.getElementById("url");
    var next = document.getElementById("next");
    var prev = document.getElementById("prev");
    var fileio = document.getElementById("fileio");
    var toggle = document.getElementById("toggle");
    var methods = document.getElementById("methods");
    /*  */
    var slider = document.querySelector("#slider input");
    /*  */
    var print = document.querySelector(".sidebar table .print");
    var reload = document.querySelector(".sidebar table .reload");
    var support = document.querySelector(".sidebar table .support");
    var donation = document.querySelector(".sidebar table .donation");
    /*  */
    var settings = document.querySelector(".toolbar");
    var dark = document.querySelector(".toolbar .dark");
    var sepia = document.querySelector(".toolbar .sepia");
    var light = document.querySelector(".toolbar .light");
    var serif = document.querySelector(".toolbar .serif");
    var sansserif = document.querySelector(".toolbar .sans-serif");
    var increasesize = document.querySelector(".toolbar .increase-size");
    var decreasesize = document.querySelector(".toolbar .decrease-size");
    var increasewidth = document.querySelector(".toolbar .increase-width");
    var decreasewidth = document.querySelector(".toolbar .decrease-width");
    var increaseheight = document.querySelector(".toolbar .increase-height");
    var decreaseheight = document.querySelector(".toolbar .decrease-height");
    /*  */
    print.addEventListener("click", config.handle.settings.click);
    serif.addEventListener("click", config.handle.settings.click);
    sansserif.addEventListener("click", config.handle.settings.click);
    increasesize.addEventListener("click", config.handle.settings.click);
    decreasesize.addEventListener("click", config.handle.settings.click);
    increasewidth.addEventListener("click", config.handle.settings.click);
    decreasewidth.addEventListener("click", config.handle.settings.click);
    increaseheight.addEventListener("click", config.handle.settings.click);
    decreaseheight.addEventListener("click", config.handle.settings.click);
    /*  */
    prev.addEventListener("click", config.action.left, false);
    next.addEventListener("click", config.action.right, false);
    reload.addEventListener("click", function () {document.location.reload()}, false);
    /*  */
    slider.addEventListener("change", config.action.slide, false);
    slider.addEventListener("mouseup", function () {config.reader.slider.mouse.down = false}, false);
    slider.addEventListener("mousedown", function () {config.reader.slider.mouse.down = true}, false);
    /*  */
    support.addEventListener("click", function () {
      var url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      var url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    methods.addEventListener("change", function (e) {
      config.reader.method = e.target[e.target.selectedIndex].value;
      config.app.start();
    }, false);
    /*  */
    toggle.addEventListener("click", function () {
      config.reader.toggle = config.reader.toggle === "show" ? "hide" : "show";
      config.app.start();
    }, false);
    /*  */
    light.addEventListener("click", function () {
      config.reader.theme.color = "light";
      config.app.start();
    });
    /*  */
    dark.addEventListener("click", function () {
      config.reader.theme.color = "dark";
      config.app.start();
    });
    /*  */
    sepia.addEventListener("click", function () {
      config.reader.theme.color = "sepia";
      config.app.start();
    });
    /*  */
    settings.addEventListener("keydown", function (e) {
      var up = e.key === "ArrowUp" && e.target.className.indexOf("increase") !== -1;
      var down = e.key === "ArrowDown" && e.target.className.indexOf("decrease") !== -1;
      if (up || down) config.handle.settings.click(e);
    }, false);
    /*  */
    url.addEventListener("change", function (e) {
      if (e.target.value) {
        var context = document.documentElement.getAttribute("context");
        if (context !== "webapp") {
          chrome.permissions.request({"origins": [e.target.value]}, function (allow) {
            if (allow) {
              config.fetch(e.target.value);
            }
          });
        } else {
          try {
            config.fetch(e.target.value);
          } catch (e) {}
        }
      } else {
        config.fetch('');
      }
    }, false);
    /*  */
    fileio.addEventListener("change", function (e) {
      if (e.target) {
        if (e.target.files) {
          var file = e.target.files[0];
          if (file) {
            var ext = file.name.indexOf(config.reader.ext) !== -1;
            if (ext) {
              var reader = new FileReader();
              reader.readAsArrayBuffer(file);
              reader.onload = function () {
                config.url = '';
                url.value = config.url;
                config.render(this.result);
                config.reader.url = config.url;
              };
              config.info.textContent = "Loading document, please wait...";
            } else config.info.textContent = "Invalid ebook file! please try again.";
          } else config.info.textContent = "No file selected! please try again.";
        }
      }
    });
  }
};
