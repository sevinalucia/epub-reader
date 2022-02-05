config.render = function (result) {
  config.action.empty();
  if (result !== undefined) config.result = result;
  /*  */
  if (config.result) {
    var height  = {};
    var footer = document.querySelector(".footer");
    var content = document.querySelector(".content");
    var toolbar = document.querySelector(".toolbar");
    var container = document.querySelector(".container");
    /*  */
    height.f = window.getComputedStyle(footer).height;
    height.t = window.getComputedStyle(toolbar).height;
    height.c = window.getComputedStyle(container).height;
    /*  */
    var options = config.reader.rendition.option[config.reader.method];
    if (options) {
      content.style.opacity = "0.0";
      config.info.textContent = "Loading document, please wait...";
      try {
        config.book = config.reader.engine();
        config.book.open(config.result);
        config.rendition = config.book.renderTo("ebook", options);
        /*  */
        config.rendition.themes.default({
          "body": {
            "padding-top": "10px !important",
            "height": height.c + " !important",
            "padding-bottom": "10px !important"
          },
          "a:link": {"color": "rgb(109, 109, 212)"},
          "a:visited": {"color": "rgb(156, 156, 208)"},
          ".block-rw": {"font-family": "inherit", "line-height": "inherit", "color": "inherit"},
          ".galley-rw": {"font-family": "inherit", "line-height": "inherit", "color": "inherit"}
        });
        /*  */
        config.rendition.themes.register("dark", {"body": {"background-color": "#333333", "color": "#dcdcdc"}});
        config.rendition.themes.register("light", {"body": {"background-color": "#ffffff", "color": "#333333"}});
        config.rendition.themes.register("sepia", {"body": {"background-color": "#f4ecd8", "color": "#333333"}});
        /*  */
        config.book.loaded.navigation.then(function (e) {
          config.reader.elements.chapters = document.createElement("select");
          /*  */
          e.toc.forEach(function (chapter, index) {
            var option = document.createElement("option");
            option.textContent = index ? index + " - " + chapter.label : chapter.label;
            option.setAttribute("chapter", chapter.href);
            config.reader.elements.chapters.appendChild(option);
          });
          /*  */
          config.reader.elements.chapters.addEventListener("change", function (e) {
            var index = e.target.selectedIndex;
            var chapter = e.target[index].getAttribute("chapter");
            if (chapter) {
              config.rendition.display(chapter).then(function () {});
            }
          });
          /*  */
          config.info.textContent = '';
          config.renderer.textContent = '';
          config.info.removeAttribute("empty");
          config.info.setAttribute("chapters", '');
          config.renderer.removeAttribute("empty");
          config.info.appendChild(config.reader.elements.chapters);
        });
        /*  */
        config.book.ready.then(function () {
          var current = config.book.key();
          var key = config.reader.stored.location.key;
          var cfi = config.reader.stored.location.cfi;
          var metadata = config.book.package.metadata;
          var valid = {"cfi": null, "locations": null};
          var locations = config.reader.stored.location.object;
          var slider = document.querySelector("#slider input");
          /*  */
          config.loading.textContent = "Loading book data...";
          valid.cfi = cfi && key === current ? cfi : config.book.navigation.toc[0].href;
          valid.locations = locations && key === current && JSON.parse(locations).length > 0;
          document.title = document.title + " :: " + metadata.title + (metadata.language ? " (" + metadata.language + ")" : '');
          /*  */
          config.rendition.display(valid.cfi).then(function () {
            var element = config.renderer.firstChild;
            if (element) {
              if (config.renderer.firstChild.style) {
                content.style.opacity = "1.0";
                footer.setAttribute("render", '');
                toolbar.setAttribute("render", '');
                container.setAttribute("render", '');
                /*  */
                var state = container.getAttribute("state");
                var render = container.getAttribute("render") !== null;
                var mobileview = parseInt(window.getComputedStyle(document.documentElement).width) < 600;
                /*  */
                height.r = "calc(100vh" + " - " + height.t + " - " + height.f + " - " + (state === "hide" ? (mobileview ? "64px" : "19px") : (render ? "23px" : "9px")) + ')';
                /*  */
                config.renderer.firstChild.style.width = "100%";
                config.renderer.firstChild.style.margin = "auto";
                config.renderer.firstChild.style.height = height.r;
                config.renderer.firstChild.style.maxWidth = "100%";
                config.renderer.firstChild.style.maxHeight = height.r;
                config.renderer.firstChild.style.overflowX = "hidden";
              }
            }
          });
          /*  */
          config.rendition.on("keyup", config.keyup);
          config.rendition.on("rendered", function (section) {config.style.update()});
          config.rendition.on("relocated", function (location) {
            if (config.relocated === false) config.style.update(true);
            /*  */
            var a = "Chapter #" + (location.start.index + 1) + (config.book.locations.spine ? '/' + config.book.locations.spine.length : '');
            var b = " - " + location.start.displayed.page + '/' + location.start.displayed.total;
            var c = config.book.locations ? " :: " + (location.start.location > -1 ? location.start.location + '/' : '') + config.book.locations.total : '';
            var d = Math.floor(location.start.percentage * 100) + '%';
            /*  */
            config.status.textContent = a + b + c + ', ' + d;
            config.reader.stored.location.cfi = location.start.cfi;
            if (!config.reader.slider.mouse.down) slider.value = Math.floor(location.start.percentage * 100);
            if (config.reader.elements.chapters) config.reader.elements.chapters.selectedIndex = location.start.index;
            /*  */
            window.setTimeout(function () {
              document.getElementById("prev").style.opacity = 0.1;
              document.getElementById("next").style.opacity = 0.1;
            }, 300);
          });
          /*  */
          config.rendition.hooks.content.register(function (e) {
            if (window.Touch) {
              const target = e.document.documentElement;
              if (target) {
                var start = window.Touch, end = window.Touch;
                target.addEventListener("touchstart", function (e) {start = e.changedTouches[0]});
                target.addEventListener("touchend", function (e) {
                  end = e.changedTouches[0];
                  if (config.renderer) {
                    const bound = config.renderer.getBoundingClientRect();
                    const hr = (end.screenX - start.screenX) / bound.width;
                    const vr = Math.abs((end.screenY - start.screenY) / bound.height);
                    /*  */
                    if (hr > 0.25 && vr < 0.1) return config.action.left();
                    if (hr < -0.25 && vr < 0.1) return config.action.right();
                  }
                });
              }
            }
          });
          /*  */
          return valid.locations ? config.book.locations.load(locations) : config.book.locations.generate(config.reader.chars);
        }).then(function () {
          config.loading.textContent = '';
          config.reader.stored.location.key = config.book.key();
          config.reader.stored.location.object = config.book.locations.save();
          /*  */
          config.style.update();
        });
        
      } catch (e) {
        content.style.opacity = "1.0";
        config.info.textContent = "An error has occurred! please try again.";
      }
    }
  } else {
    config.style.update();
  }
};
