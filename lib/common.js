var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "interface": {
    "open": function (reload) {
      var context = config.interface.context;
      var url = app.interface.path + '?' + context;
      /*  */
      if (context === "popup") app.button.popup(url);
      else {
        if (app.interface.id) {
          if (context === "tab") {
            app.tab.get(app.interface.id, function (tab) {
              if (tab) {
                app.tab.update(app.interface.id, {"active": true}, function () {
                  if (reload === true) {
                    app.interface.post("reload");
                  }
                });
              } else {
                app.interface.id = '';
                app.tab.open(url);
              }
            });
          }
          /*  */
          if (context === "win") {
            app.window.get(app.interface.id, function (win) {
              if (win) {
                app.window.update(app.interface.id, {"focused": true}, function () {
                  if (reload === true) {
                    app.interface.post("reload");
                  }
                });
              } else {
                app.interface.id = '';
                app.interface.create();
              }
            });
          }
        } else {
          if (context === "tab") app.tab.open(url);
          if (context === "win") app.interface.create(url);
        }
      }
    }
  },
  "load": function () {
    app.interface.id = '';
    /*  */
    var context = config.interface.context;
    var url = app.interface.path + '?' + context;
    /*  */
    app.button.popup(context === "popup" ? url : '');
    /*  */
    app.contextmenu.create({
      "id": "page",
      "contexts": ["link"],
      "title": "View in ePUB Reader",
      "targetUrlPatterns": ["epub"].map(e => "*://*/*." + e)
    }, app.error);
    /*  */
    app.contextmenu.create({
      "id": "tab",
      "type": "radio",
      "title": "Open in tab", 
      "contexts": ["action"],
      "checked": context === "tab"
    }, app.error);
    /*  */
    app.contextmenu.create({
      "id": "win",
      "type": "radio",
      "title": "Open in win",
      "contexts": ["action"],
      "checked": context === "win"
    }, app.error);
    /*  */
    app.contextmenu.create({
      "id": "popup",
      "type": "radio",
      "contexts": ["action"],
      "title": "Open in popup",
      "checked": context === "popup"
    }, app.error);
  }
};

app.button.on.clicked(function () {
  core.interface.open(false);
});

app.window.on.removed(function (e) {
  if (e === app.interface.id) {
    app.interface.id = '';
  }
});

app.contextmenu.on.clicked(function (e) {
  if (e.menuItemId === "page") {
    config.book.url = e.linkUrl || e.srcUrl;
    if (config.book.url) {
      core.interface.open(true);
    }
  } else {
    app.interface.close(config.interface.context);
    config.interface.context = e.menuItemId;
    /*  */
    var context = config.interface.context;
    var url = app.interface.path + '?' + context;
    app.button.popup(context === "popup" ? url : ''); 
  }
});

app.on.startup(core.start);
app.on.installed(core.install);