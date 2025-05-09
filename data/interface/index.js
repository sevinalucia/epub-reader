var background = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      background.message[id] = callback;
    }
  },
  "connect": function (port) {
    chrome.runtime.onMessage.addListener(background.listener); 
    /*  */
    if (port) {
      background.port = port;
      background.port.onMessage.addListener(background.listener);
      background.port.onDisconnect.addListener(function () {
        background.port = null;
      });
    }
  },
  "send": function (id, data) {
    if (id) {
      if (context !== "webapp") {
        chrome.runtime.sendMessage({
          "method": id,
          "data": data,
          "path": "interface-to-background"
        }, function () {
          return chrome.runtime.lastError;
        });
      }
    }
  },
  "post": function (id, data) {
    if (id) {
      if (background.port) {
        background.port.postMessage({
          "method": id,
          "data": data,
          "port": background.port.name,
          "path": "interface-to-background"
        });
      }
    }
  },
  "listener": function (e) {
    if (e) {
      for (let id in background.message) {
        if (background.message[id]) {
          if ((typeof background.message[id]) === "function") {
            if (e.path === "background-to-interface") {
              if (e.method === id) {
                background.message[id](e.data);
              }
            }
          }
        }
      }
    }
  }
};

var config = {
  "url": '',
  "info": null,
  "timeout": {},
  "result": null,
  "relocated": false,
  "reload": function () {
    document.location.reload();
  },
  "keyup": function (e) {
    if ((e.keyCode || e.which) === 37) config.action.left();
    if ((e.keyCode || e.which) === 39) config.action.right();
  },
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "prevent": {
    "drop": function (e) {
      if (e.target.id.indexOf("fileio") !== -1) return;
      e.preventDefault();
    }
  },
  "load": function () {
    config.info = document.querySelector(".info");
    config.status = document.getElementById("status");
    config.renderer = document.getElementById("ebook");
    config.loading = document.getElementById("loading");
    /*  */
    config.app.listeners.add();
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          const current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
      }
    }
  },
  "style": {
    "update": function (resize) {
      document.documentElement.setAttribute("color", config.reader.theme.color);
      /*  */
      if (config.rendition) {
        const width = config.reader.container.width;
        /*  */
        config.rendition.themes.font(config.reader.font.family);
        config.rendition.themes.select(config.reader.theme.color);
        config.rendition.themes.fontSize(config.reader.font.size + '%');
        config.rendition.themes.override("line-height", config.reader.container.line.height + "em", true);
        config.loading.textContent = "Font: " + config.reader.font.family + ' ' + config.reader.font.size + '%' + ", width: " + width + '%' + ", line-height: " + config.reader.container.line.height + "em";
        /*  */
        if (resize) {
          try {
            config.relocated = resize;
            config.rendition.resize((width + "vw"), "100vh");
          } catch (e) {}
        }
      }
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          let tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      const context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.body.style.width = "760px";
              document.body.style.height = "550px";
            }
            /*  */
            background.connect(chrome.runtime.connect({"name": config.port.name}));
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "fetch": function (url) {
    if (url !== undefined) {
      config.url = url;
      config.reader.url = config.url;
    }
    /*  */
    if (config.url) {
      config.action.empty();
      if (config.xhr) config.xhr.abort();
      /*  */
      config.xhr = new XMLHttpRequest();
      config.xhr.open("GET", config.url, true);
      config.xhr.responseType = "arraybuffer";
      config.info.textContent = "Fetching document 0% please wait...";
      config.renderer.textContent = "Loading document, please wait...";
      /*  */
      config.xhr.onload = function () {config.render(this.response)};
      config.xhr.onerror = function () {config.info.textContent = "An error has occurred! please try again."};
      config.xhr.onprogress = function (e) {
        const percent = e.total ? Math.floor((e.loaded / e.total) * 100) : '?';
        config.info.textContent = "Fetching document " + percent + "% please wait...";
      };
      /*  */
      config.xhr.send();
    } else {
      config.render('');
    }
  },
  "app": {
    "start": function () {
      if (config.reader.url && config.reader.url !== config.url) config.result = '';
      /*  */
      config.relocated = false;
      config.url = config.reader.url;
      document.getElementById("url").value = config.reader.url;
      document.getElementById("methods").value = config.reader.method;
      document.getElementById("slider").setAttribute("state", config.reader.toggle);
      document.getElementById("toggle").setAttribute("state", config.reader.toggle);
      document.getElementById("toggle").setAttribute("method", config.reader.method);
      document.getElementById("toggle").textContent = config.reader.toggle === "show" ? '▲' : '▼';
      /*  */
      document.getElementById("next").setAttribute("method", config.reader.method);
      document.getElementById("prev").setAttribute("method", config.reader.method);
      document.querySelector(".footer").setAttribute("state", config.reader.toggle);
      document.querySelector(".sidebar").setAttribute("state", config.reader.toggle);
      document.querySelector(".content").setAttribute("state", config.reader.toggle);
      document.querySelector(".toolbar").setAttribute("toggle", config.reader.toggle);
      document.querySelector(".container").setAttribute("state", config.reader.toggle);
      /*  */
      let mobileview = document.querySelector("link[href='resources/mobileview.css']");
      if (!mobileview) {
        mobileview = document.createElement("link");
        mobileview.setAttribute("rel", "stylesheet");
        mobileview.setAttribute("href", "resources/mobileview.css");
        document.head.appendChild(mobileview);
      }
      /*  */
      config[config.result ? "render" : "fetch"]();
    }
  },
  "action": {
    "slide": function (e) {
      if (config.book) {
        const cfi = config.book.locations.cfiFromPercentage(e.target.value / 100);
        if (cfi) {
          config.rendition.display(cfi);
        }
      }
    },
    "left": async function (e) {
      if (config.book) {
        if (config.book.package && config.book.package.metadata) {
          const rtl = config.book.package.metadata.direction === "rtl";
          document.getElementById(rtl ? "next" : "prev").style.opacity = 1;
          rtl ? await config.rendition.next() : await config.rendition.prev();
          /*  */
          if (e) e.preventDefault();
        }
      }
    },
    "right": async function (e) {
      if (config.book) {
        if (config.book.package && config.book.package.metadata) {
          const rtl = config.book.package.metadata.direction === "rtl";
          document.getElementById(rtl ? "prev" : "next").style.opacity = 1;
          rtl ? await config.rendition.prev() : await config.rendition.next();
          /*  */
          if (e) e.preventDefault();
        }
      }
    },
    "empty": function () {
      if (config.xhr) config.xhr.abort();
      if (config.book) config.book.destroy();
      /*  */
      config.info.setAttribute("empty", '');
      config.renderer.setAttribute("empty", '');
      config.info.removeAttribute("chapters", '');
      config.loading.textContent = document.title;
      config.info.textContent = document.title + " is ready";
      config.status.textContent = "Chapter # - 0/0 :: 0/0, 0%";
      config.renderer.textContent = "Please enter a book URL or drag & drop an ebook file above (top-right corner)";
    }
  },
  "handle": {
    "settings": {
      "click": function (e) {
        switch (e.target.className) {
          case "print": config.handle.settings.print(); break;
          case "serif": config.reader.font.family = "serif"; break;
          case "sans-serif": config.reader.font.family = "sans-serif"; break;
          case "decrease-size": config.reader.font.size = config.reader.font.size > 50 ? config.reader.font.size - 1 : 50; break;
          case "increase-size": config.reader.font.size = config.reader.font.size < 300 ? config.reader.font.size + 1 : 300; break;
          case "decrease-width": config.reader.container.width = config.reader.container.width > 30 ? config.reader.container.width - 1 : 30; break;
          case "increase-width": config.reader.container.width = config.reader.container.width < 100 ? config.reader.container.width + 1 : 100; break;
          case "decrease-height": config.reader.container.line.height = config.reader.container.line.height > 1 ? config.reader.container.line.height - 0.05 : 1; break;
          case "increase-height": config.reader.container.line.height = config.reader.container.line.height < 10 ? config.reader.container.line.height + 0.05 : 10; break;
          default: break;
        }
        /*  */
        config.reader.container.line.height = Number(config.reader.container.line.height.toFixed(2));
        config.style.update(true);
      },
      "print": async function () {
        const book = config.reader.engine();
        const current = config.loading.textContent;
        const extra = document.querySelector(".extra");
        const result = document.getElementById("result");
        const preview = document.getElementById("preview");
        const options = {"width": "100%", "height": "100%", "flow": "scrolled-doc", "fullsize": true};
        /*  */
        try {
          await new Promise(resolve => window.setTimeout(resolve, 300));
          /*  */
          config.loading.textContent = "Preparing for print, please wait...";
          extra.setAttribute("state", "show");
          /*  */
          await new Promise(resolve => window.setTimeout(resolve, 300));
          book.open(config.result);
          const rendition = book.renderTo("preview", options);
          /*  */
          await book.ready;
          const tocs = await book.loaded.navigation;
          await new Promise(resolve => window.setTimeout(resolve, 300));
          /*  */
          result.textContent = '';
          for (let i = 0; i < tocs.toc.length; i++) {
            const toc = tocs.toc[i];
            await rendition.display(toc.href);
            const target = preview.querySelector(".epub-container");
            const tmp = target.cloneNode(true);
            /*  */
            config.loading.textContent = "Preparing to print item #" + i + "/" + tocs.toc.length + ", please wait...";
            tmp.setAttribute("label", toc.label);
            tmp.setAttribute("href", toc.href);
            result.appendChild(tmp);
          }
          /*  */
          config.loading.textContent = current;
          await new Promise(resolve => window.setTimeout(resolve, 300));
          /*  */
          window.print();
          //book.destroy();
          //result.textContent = '';
          //preview.textContent = '';
          //extra.setAttribute("state", "hide");
        } catch (e) {
          book.destroy();
          result.textContent = '';
          preview.textContent = '';
          extra.setAttribute("state", "hide");
        }
      }
    }
  },
  "reader": {
    "pages": [],
    "chars": 1024,
    "ext": ".epub",
    "engine": window.ePub,
    "elements": {"chapters": null},
    "current": {"page": {"number": 0}},
    "slider": {"mouse": {"down": false}},
    "theme": {
      set color (val) {if (val) config.storage.write("theme-color", val)},
      get color () {return config.storage.read("theme-color") !== undefined ? config.storage.read("theme-color") : "light"}
    },
    "font": {
      set size (val) {if (val) config.storage.write("font-size", val)},
      set family (val) {if (val) config.storage.write("font-family", val)},
      get size () {return config.storage.read("font-size") !== undefined ? config.storage.read("font-size") : 100},
      get family () {return config.storage.read("font-family") !== undefined ? config.storage.read("font-family") : "serif"}
    },
    "container": {
      set width (val) {if (val) config.storage.write("container-width", val)},
      get width () {return config.storage.read("container-width") !== undefined ? config.storage.read("container-width") : 100},
      "line": {
        set height (val) {if (val) config.storage.write("line-height", val)},
        get height () {return config.storage.read("line-height") !== undefined ? config.storage.read("line-height") : 1.2}
      }
    },
    set url (val) {config.storage.write("bookurl", val)},
    set toggle (val) {config.storage.write("toggle", val)},
    set method (val) {config.storage.write("method", val)},
    get url () {return config.storage.read("bookurl") !== undefined ? config.storage.read("bookurl") : ''},
    get toggle () {return config.storage.read("toggle") !== undefined ? config.storage.read("toggle") : "show"},
    get method () {return config.storage.read("method") !== undefined ? config.storage.read("method") : "scrolled-continuous"},
    "stored": {
      "location": {
        set cfi (val) {config.storage.write("cfi", val)},
        set key (val) {config.storage.write("key", val)},
        set object (val) {config.storage.write("object", val)},
        get key () {return config.storage.read("key") !== undefined ? config.storage.read("key") : ''},
        get cfi () {return config.storage.read("cfi") !== undefined ? config.storage.read("cfi") : ''},
        get object () {return config.storage.read("object") !== undefined ? config.storage.read("object") : ''}
      }
    },
    "rendition": {
      "option": {
        "archived": {"width": "100%", "height": "100%"},
        "spreads": {"width": "100%", "height": "100%", "spread": "always"},
        "scrolled": {"width": "100%", "flow": "scrolled-doc", "fullsize": true},
        "hypothes": {"width": "100%", "height": "100%", "flow": "scrolled-doc", "ignoreClass": "annotator-hl"},
        "spreads-continuous": {"width": "100%", "height": "100%", "flow": "paginated", "manager": "continuous"},
        "scrolled-continuous": {"width": "100%", "height": "100%", "flow": "scrolled", "manager": "continuous"},
        "swipe": {"width": "100%", "height": "100%", "flow": "paginated", "manager": "continuous", "snap": true},
        "highlights": {"width": "100%", "height": "100%", "manager": "continuous", "ignoreClass": "annotator-hl"}
      }
    }
  }
};


config.port.connect();
background.receive("reload", config.reload);

document.addEventListener("keyup", config.keyup, false);
document.addEventListener("drop", config.prevent.drop, true);
document.addEventListener("dragover", config.prevent.drop, true);

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
