var background = (function () {
  var tmp = {};
  var context = document.documentElement.getAttribute("context");
  if (context === "webapp") {
    return {
      "send": function () {},
      "receive": function (callback) {}
    }
  } else {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      for (var id in tmp) {
        if (tmp[id] && (typeof tmp[id] === "function")) {
          if (request.path === "background-to-interface") {
            if (request.method === id) tmp[id](request.data);
          }
        }
      }
    });
    /*  */
    return {
      "receive": function (id, callback) {tmp[id] = callback},
      "send": function (id, data) {chrome.runtime.sendMessage({"path": "interface-to-background", "method": id, "data": data})}
    }
  }
})();

var config = {
  "url": '',
  "info": null,
  "timeout": {},
  "result": null,
  "relocated": false,
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
      var context = document.documentElement.getAttribute("context");
      if (context === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(function () {
          config.storage.write("interface.size", {
            "width": window.innerWidth || window.outerWidth,
            "height": window.innerHeight || window.outerHeight
          });
          /*  */
          config.app.start();
        }, 300);
      }
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
      config.xhr.onprogress = function (e) {config.info.textContent = "Fetching document " + Math.floor((e.loaded / e.total) * 100) + "% please wait..."};
      /*  */
      config.xhr.send();
    } else {
      config.render('');
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
          var tmp = {};
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
  "handle": {
    "settings": {
      "click": function (e) {
        var iframe = config.renderer.querySelector("iframe");
        switch (e.target.className) {
          case "serif": config.reader.font.family = "serif"; break;
          case "print": if (iframe) iframe.contentWindow.print(); break;
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
      }
    }
  },
  "app": {
    "start": function (e) {
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
      var mobileview = document.querySelector("link[href='resources/mobileview.css']");
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
  "style": {
    "update": function (resize) {
      var width = config.reader.container.width;
      var container = document.querySelector(".container");
      var height = window.getComputedStyle(container).height;
      document.documentElement.setAttribute("color", config.reader.theme.color);
      /*  */
      if (config.rendition) {
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
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
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
            chrome.runtime.connect({"name": config.port.name});
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "action": {
    "slide": function (e) {
      if (config.book) {
        var cfi = config.book.locations.cfiFromPercentage(e.target.value / 100);
        if (cfi) {
          config.rendition.display(cfi);
        }
      }
    },
    "left": async function (e) {
      if (config.book) {
        if (config.book.package && config.book.package.metadata) {
          var rtl = config.book.package.metadata.direction === "rtl";
          document.getElementById(rtl ? "next" : "prev").style.opacity = 1;
          rtl ? await config.rendition.next() : await config.rendition.prev();
          e.preventDefault();
        }
      }
    },
    "right": async function (e) {
      if (config.book) {
        if (config.book.package && config.book.package.metadata) {
          var rtl = config.book.package.metadata.direction === "rtl";
          document.getElementById(rtl ? "prev" : "next").style.opacity = 1;
          rtl ? await config.rendition.prev() : await config.rendition.next();
          e.preventDefault();
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
    set url (val) {config.storage.write("url", val)},
    set toggle (val) {config.storage.write("toggle", val)},
    set method (val) {config.storage.write("method", val)},
    get url () {return config.storage.read("url") !== undefined ? config.storage.read("url") : ''},
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
        "scrolled": {"width": "100%", "flow": "scrolled-doc"},
        "spreads": {"width": "100%", "height": "100%", "spread": "always"},
        "hypothes": {"width": "100%", "height": "100%", "flow": "scrolled-doc", "ignoreClass": "annotator-hl"},
        "spreads-continuous": {"width": "100%", "height": "100%", "flow": "paginated", "manager": "continuous"},
        "scrolled-continuous": {"width": "100%", "height": "100%", "flow": "scrolled", "manager": "continuous"},
        "swipe": {"width": "100%", "height": "100%", "flow": "paginated", "manager": "continuous", "snap": true},
        "highlights": {"width": "100%", "height": "100%", "manager": "continuous", "ignoreClass": "annotator-hl"},
      }
    }
  }
};

background.receive("url", function (e) {
  chrome.permissions.request({"origins": [e.url]}, function (allow) {
    if (allow) {
      config.reader.url = e.url;
      config.app.start();
    }
  });
});

config.port.connect();

window.addEventListener("load", config.load, false);
document.addEventListener("keyup", config.keyup, false);
document.addEventListener("drop", config.prevent.drop, true);
window.addEventListener("resize", config.resize.method, false);
document.addEventListener("dragover", config.prevent.drop, true);
