config.app.listeners = {
  "add": function () {
    const url = document.getElementById("url");
    const next = document.getElementById("next");
    const prev = document.getElementById("prev");
    const fileio = document.getElementById("fileio");
    const toggle = document.getElementById("toggle");
    const methods = document.getElementById("methods");
    const current = document.getElementById("current");
    /*  */
    const slider = document.querySelector("#slider input");
    /*  */
    const print = document.querySelector(".sidebar table .print");
    const reload = document.querySelector(".sidebar table .reload");
    const support = document.querySelector(".sidebar table .support");
    const donation = document.querySelector(".sidebar table .donation");
    /*  */
    const settings = document.querySelector(".toolbar");
    const dark = document.querySelector(".toolbar .dark");
    const sepia = document.querySelector(".toolbar .sepia");
    const light = document.querySelector(".toolbar .light");
    const serif = document.querySelector(".toolbar .serif");
    const sansserif = document.querySelector(".toolbar .sans-serif");
    const increasesize = document.querySelector(".toolbar .increase-size");
    const decreasesize = document.querySelector(".toolbar .decrease-size");
    const increasewidth = document.querySelector(".toolbar .increase-width");
    const decreasewidth = document.querySelector(".toolbar .decrease-width");
    const increaseheight = document.querySelector(".toolbar .increase-height");
    const decreaseheight = document.querySelector(".toolbar .decrease-height");
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
      const url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      const url = config.addon.homepage() + "?reason=support";
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
      const up = e.key === "ArrowUp" && e.target.className.indexOf("increase") !== -1;
      const down = e.key === "ArrowDown" && e.target.className.indexOf("decrease") !== -1;
      if (up || down) config.handle.settings.click(e);
    }, false);
    /*  */
    current.addEventListener("click", function () {
      if (config.renderer) {
        const iframe = config.renderer.querySelector("iframe");
        if (iframe) {
          iframe.contentWindow.print();
        }
      }
    }, false);
    /*  */
    url.addEventListener("change", function (e) {
      if (e.target.value) {
        try {
          config.fetch(e.target.value);
        } catch (e) {}
      } else {
        config.fetch('');
      }
    }, false);
    /*  */
    fileio.addEventListener("change", function (e) {
      if (e.target) {
        if (e.target.files) {
          const file = e.target.files[0];
          if (file) {
            const ext = file.name.indexOf(config.reader.ext) !== -1;
            if (ext) {
              const reader = new FileReader();
              reader.readAsArrayBuffer(file);
              reader.onload = function () {
                config.url = '';
                url.value = config.url;
                config.render(this.result);
                config.reader.url = config.url;
              };
              /*  */
              config.info.textContent = "Loading document, please wait...";
            } else {
              config.info.textContent = "Invalid ebook file! please try again.";
            }
          } else {
            config.info.textContent = "No file selected! please try again.";
          }
        }
      }
    });
  }
};
