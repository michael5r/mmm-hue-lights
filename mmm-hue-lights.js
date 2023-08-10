/* global Module */

/* Magic Mirror
 * Module: mmm-hue-lights
 *
 * By Michael Schmidt
 * https://github.com/michael5r
 *
 * MIT Licensed.
 */

Module.register("mmm-hue-lights", {
  defaults: {
    bridgeIp: "",
    user: "",
    displayType: "grid",
    displayMode: "lights",
    displayFilter: ["all"],
    hideFilter: [],
    hideOff: false,
    alignment: "left",
    coloredList: true,
    minimalList: false,
    minimalGrid: false,
    minimalGridUltra: false,
    orderByName: false,
    motionSleep: false,
    motionSleepSeconds: 300, // this is in seconds (not ms)
    updateInterval: 2 * 60 * 1000,
    animationSpeed: 2 * 1000,
    initialLoadDelay: 0,
    version: "1.4.0",
  },

  getScripts: function () {
    return ["handlebars.runtime.min.js", "mmm-hue-lights-templates.js"];
  },

  getStyles: function () {
    return ["mmm-hue-lights.css"];
  },

  start: function () {
    Log.info(
      "Starting module: " + this.name + ", version " + this.config.version
    );

    this.errMsg = "";

    this.loaded = false;
    this.scheduleUpdate(this.config.initialLoadDelay);

    this.sleepTimer = null;
    this.sleeping = false;

    this.lights = {};
    this.groups = {};
  },

  getDom: function () {
    var displayType = this.config.displayType;
    var displayMode = this.config.displayMode;
    var alignment = this.config.alignment;
    var minimalList = this.config.minimalList;
    var minimalGrid = this.config.minimalGrid;
    var minimalGridUltra =
      displayMode === "lights" ? this.config.minimalGridUltra : false;
    var coloredList = this.config.coloredList;

    var outer_wrapper = document.createElement("div");

    // show error message
    if (this.errMsg !== "") {
      outer_wrapper.innerHTML = this.errMsg;
      outer_wrapper.className = "normal regular small";
      return outer_wrapper;
    }

    // show loading message
    if (!this.loaded) {
      outer_wrapper.innerHTML = "Loading ...";
      outer_wrapper.className = "bright light small";
      return outer_wrapper;
    }

    if (displayType === "list") {
      // list mode view

      outer_wrapper.className = this.classNames(
        "hue-wrapper",
        "list",
        alignment,
        minimalList ? "minimal" : "",
        displayMode === "groups" ? "groups" : "",
        !coloredList ? "bw" : ""
      );
      outer_wrapper.innerHTML = this.renderList();
    } else {
      // grid mode view

      outer_wrapper.className = this.classNames(
        "hue-wrapper",
        "grid",
        minimalGrid ? "minimal" : "",
        minimalGridUltra ? "minimal-ultra" : "",
        minimalGridUltra ? alignment : "",
        displayMode === "groups" ? "groups" : ""
      );
      outer_wrapper.innerHTML = this.renderGrid();

      outer_wrapper.addEventListener("click", (event) => this.onClick(event));
    }

    return outer_wrapper;
  },

  onClick: function (event) {
    let el = event.target;
    while (!/A/i.test(el.tagName) && el.parentElement) {
      el = el.parentElement;
    }

    const lightNum = el.dataset.lightNum;
    const isOn = el.dataset.isOn === "true";
    if (lightNum) {
      this.toggleLight(lightNum, isOn);
    }
  },

  toggleLight: function (lightNum, isOn) {
    const state = isOn ? "OFF" : "ON";
    const hueUrl = `http://${this.config.bridgeIp}/api/${this.config.user}/${this.config.displayMode}/${lightNum}/state`;
    this.sendSocketNotification(`TURN_${state}_LIGHTS`, hueUrl);
  },

  renderList: function () {
    var self = this;

    var isLights = this.config.displayMode === "lights";
    var hideOff = this.config.hideOff;
    var minimalList = this.config.minimalList;
    var alignment = this.config.alignment;
    var orderByName = this.config.orderByName;

    var lights = this.lights;
    var groups = this.groups;

    var hiddenOffItems = false;

    // create handlebars data object
    var hbData = {
      isRightAligned: alignment === "right",
      isMinimal: minimalList,
      c2Title: isLights ? "Light" : "Group",
      c3Title: isLights ? "Product" : "Lights",
      c4Title: "Type",
      rows: [],
    };

    var data = isLights ? lights : groups;
    var dataArr = Object.values(data); // convert to array

    // sort by name if orderByName is true
    if (orderByName) {
      dataArr.sort((a, b) => (a.name > b.name ? 1 : -1));
    }

    dataArr.forEach(function (item) {
      var itemColorData = isLights ? item.state : item.action;

      var isOn = false;
      var allOn = false;
      var anyOn = false;

      if (isLights) {
        isOn = itemColorData.on;
        allOn = isOn;
        anyOn = isOn;
      } else {
        allOn = item.state.all_on;
        anyOn = item.state.any_on;
        isOn = allOn || anyOn;
      }

      if ((hideOff && isOn) || !hideOff) {
        hbData.rows.push(self.formatListRow(item));
      } else {
        hiddenOffItems = true;
      }
    });

    if (hiddenOffItems && hbData.rows.length < 1) {
      // user's lights or groups are all off
      return '<div class="normal regular small">All your Hue lights are off.</div>';
    } else {
      // generate html from template

      var hbTemplate = Handlebars.templates["hue_list_table.hbs"];
      var hbHtml = hbTemplate(hbData);

      return hbHtml;
    }
  },

  formatListRow: function (item) {
    // generates a single light or group object
    // only used in the list view

    var isLights = this.config.displayMode === "lights";
    var coloredList = this.config.coloredList;

    var lights = this.lights;
    var groups = this.groups;

    var itemColorData = isLights ? item.state : item.action;
    var type = item.type;
    var name = item.name;

    var isOn = false;
    var allOn = false;
    var anyOn = false;
    var lightsOn = 0;
    var lightText = false;

    if (isLights) {
      // lights

      isOn = itemColorData.on;
      allOn = isOn;
      anyOn = isOn;
    } else {
      // groups

      allOn = item.state.all_on;
      anyOn = item.state.any_on;
      isOn = allOn || anyOn;

      var groupLights = item.lights;
      for (j = 0; j < groupLights.length; j++) {
        var lightId = groupLights[j];
        var light = this.lights[lightId];
        if (light) {
          if (light.state.on) {
            lightsOn++;
          }
        }
      }

      if (allOn) {
        lightText = "All lights are on";
      } else if (anyOn) {
        if (lightsOn > 1) {
          lightText = lightsOn + " lights are on";
        } else {
          lightText = lightsOn + " light is on";
        }
      } else {
        lightText = "All lights are off";
      }
    }

    var mainLight = isLights ? item : { state: itemColorData };
    var mainLightColor = this.getHueColorStyle(mainLight);
    var mainLightStyle = mainLightColor.colorStyle;

    if (!mainLightStyle) {
      isOn = false;
    }

    if (!coloredList) {
      mainLightStyle = false;
    }

    var rowClass = isOn ? "on" : "off";
    var rowStyles = isOn ? mainLightStyle : false;
    var c2Text = isOn
      ? '<i class="fa fa-lightbulb-o"></i>'
      : '<i class="fa fa-power-off"></i>';
    var c2Class = false;
    var c3Text = isLights ? item.productname : lightText;
    var c3Class = false;
    var c4Text = item.type;
    var c4Class = false;

    var row = {
      rowClass,
      rowStyles,
      name,
      c2Text,
      c2Class,
      c3Text,
      c3Class,
      c4Text,
      c4Class,
    };

    return row;
  },

  renderGrid: function () {
    var self = this;

    var isLights = this.config.displayMode === "lights";
    var minimalGrid = this.config.minimalGrid;
    var minimalGridUltra = isLights ? this.config.minimalGridUltra : false;
    var hideOff = this.config.hideOff;
    var orderByName = this.config.orderByName;

    var lights = this.lights;
    var groups = this.groups;

    var numberOfLights = Object.keys(lights).length;
    var numberOfGroups = Object.keys(groups).length;

    var hiddenOffItems = false;

    // create handlebars data object

    var hbData = {
      rows: [],
    };

    // create rows

    var data = isLights ? lights : groups;
    var dataArr = Object.entries(data); // convert to array

    // sort by name if orderByName is true
    if (orderByName) {
      dataArr.sort((a, b) => (a[1].name > b[1].name ? 1 : -1));
    }

    dataArr.forEach(function (items) {
      const [lightNum, item] = items;

      var itemColorData = isLights ? item.state : item.action;
      var type = item.type.toLowerCase();

      var isOn = false;
      var allOn = false;
      var anyOn = false;

      var itemBrightness = 0;
      var itemBrightnessInPercent = 0;
      var itemBrightnessStyle = "";
      var lightText = false;

      if (isLights) {
        // lights

        isOn = itemColorData.on;
        allOn = isOn;
        anyOn = isOn;

        itemBrightness = itemColorData.bri; // value from 0 to 254
      } else {
        // groups

        allOn = item.state.all_on;
        anyOn = item.state.any_on;
        isOn = allOn || anyOn;
      }

      // calculate colors for gradient or solid background

      var colorStyle = false;
      var lightOrDark = "dark"; // default
      var lightsOn = 0;
      var coloredlightsOn = 0;
      var contrast;

      var hasColors =
        itemColorData.colormode &&
        (itemColorData.colormode === "xy" || itemColorData.colormode === "hs");

      if (hasColors && isOn) {
        // colored lights

        // calculate contrast so we know whether to show a light or dark text

        var mainLight = isLights ? item : { state: itemColorData };
        var mainLightColor = self.getHueColorStyle(mainLight);
        if (mainLightColor.colorRgb) {
          contrast = self.contrast(
            [255, 255, 255],
            [
              mainLightColor.colorRgb.r,
              mainLightColor.colorRgb.g,
              mainLightColor.colorRgb.b,
            ]
          );
          if (contrast <= 1.5) {
            // use dark text color
            lightOrDark = "dark";
          } else {
            // use light text color
            lightOrDark = "light";
          }
        }

        if (isLights) {
          // solid background for lights

          lightsOn = 1;
          colorStyle = "background-color: " + mainLightColor.colorHex + ";";
        } else {
          // gradient background for groups

          var colorRgbArr = [];
          var groupLights = item.lights;

          for (j = 0; j < groupLights.length; j++) {
            var lightId = groupLights[j];
            var light = self.lights[lightId];
            if (light) {
              if (light.state.on) {
                lightsOn++;
                itemBrightness += light.state.bri;
                var lightColor = self.getHueColorStyle(light);
                if (lightColor.colorHex) {
                  colorRgbArr.push([
                    lightColor.colorRgb.r,
                    lightColor.colorRgb.g,
                    lightColor.colorRgb.b,
                  ]);
                }
              }
            }
          }

          if (colorRgbArr.length > 0) {
            // create gradient background color

            var colorPercent = 100;

            // sort colors (be aware that this removes duplicate colors)
            var colorRgbSortedArr =
              colorRgbArr.length > 1
                ? self.sortColors(colorRgbArr)
                : colorRgbArr;

            if (typeof colorRgbSortedArr === "undefined") {
              // all colors are the same
              colorRgbSortedArr = colorRgbArr;
            }

            // set percentage
            if (colorRgbSortedArr.length > 1) {
              colorPercent = Math.round(
                100 / parseInt(colorRgbSortedArr.length - 1)
              );
            }

            // override contrast settings based on sorted colors
            contrast = self.contrast(
              [255, 255, 255],
              [
                colorRgbSortedArr[0][0],
                colorRgbSortedArr[0][1],
                colorRgbSortedArr[0][2],
              ]
            );
            if (contrast <= 2.0) {
              // use dark text color
              lightOrDark = "dark";
            } else {
              // use light text color
              lightOrDark = "light";
            }

            coloredlightsOn = colorRgbArr.length;

            for (j = 0; j < colorRgbSortedArr.length; j++) {
              if (colorRgbSortedArr.length > 1) {
                // background gradient
                if (j == 0) {
                  colorStyle =
                    "background: linear-gradient(to right, " +
                    self.rgbToHexAlt(colorRgbSortedArr[j]) +
                    " 0%";
                } else {
                  colorStyle +=
                    ", " +
                    self.rgbToHexAlt(colorRgbSortedArr[j]) +
                    " " +
                    colorPercent * j +
                    "%";
                }
              } else {
                // solid background color
                colorStyle =
                  "background-color: " +
                  self.rgbToHexAlt(colorRgbSortedArr[j]) +
                  ";";
              }
            }

            if (colorRgbSortedArr.length > 1) {
              colorStyle += ");";
            }

            itemBrightness = itemBrightness / coloredlightsOn;
          }
        }
      } else if (isOn) {
        // white lights

        if (isLights) {
          // lights

          lightsOn = 1;
        } else {
          // groups

          var groupLights = item.lights;

          for (j = 0; j < groupLights.length; j++) {
            var lightId = groupLights[j];
            var light = self.lights[lightId];
            if (light) {
              if (light.state.on) {
                itemBrightness += light.state.bri;
                lightsOn++;
              }
            }
          }
        }
      }

      // calculate brightness value in percent

      if (isOn) {
        itemBrightnessInPercent = Math.ceil((100 / 254) * itemBrightness);

        // some weird tweaks based on what I saw in the Hue app
        if (itemBrightnessInPercent < 91) {
          itemBrightnessStyle =
            "calc(" + (itemBrightnessInPercent - 1) + "% + 20px)";
        } else if (itemBrightnessInPercent > 97) {
          itemBrightnessStyle = "100%";
        } else {
          itemBrightnessStyle = itemBrightnessInPercent + "%";
        }
      }

      // set light text (only relevant for groups)

      if (!isLights) {
        if (allOn) {
          lightText = "All lights are on";
        } else if (anyOn) {
          if (lightsOn > 1) {
            lightText = lightsOn + " lights are on";
          } else {
            lightText = lightsOn + " light is on";
          }
        } else {
          lightText = "All lights are off";
        }
      }

      // set class for row

      var itemClass = self.classNames(
        isOn ? "on" : "off",
        colorStyle ? "colored-" + lightOrDark : ""
      );

      // push data to HB object

      var rowObj = {
        lightNum,
        isOn,
        isMinimal: minimalGrid || minimalGridUltra ? true : false,
        isMinimalUltra: minimalGridUltra,
        name: item.name,
        class: itemClass,
        colorStyle,
        lightText,
        itemBrightnessStyle,
      };

      if (hideOff && !isOn) {
        hiddenOffItems = true;
      }

      if ((hideOff && isOn) || !hideOff) {
        hbData.rows.push(rowObj);
      }
    });

    if (hiddenOffItems && hbData.rows.length < 1) {
      // user's lights or groups are all off
      return '<div class="normal regular small">All your Hue lights are off.</div>';
    } else {
      // generate html from template

      var hbTemplate = Handlebars.templates["hue_grid.hbs"];
      var hbHtml = hbTemplate(hbData);

      return hbHtml;
    }
  },

  getData: function () {
    if (!this.sleeping) {
      if (this.config.bridgeIp === "" || this.config.user === "") {
        this.errMsg =
          "Please add your Hue bridge IP and user to the MagicMirror config.js file.";
        this.updateDom(this.config.animationSpeed);
      } else {
        this.sendSocketNotification("MMM_HUE_LIGHTS_GET", {
          bridgeIp: this.config.bridgeIp,
          user: this.config.user,
        });
      }
    }
  },

  notificationReceived(notification, payload, sender) {
    var self = this;

    if (notification === "USER_PRESENCE" && this.config.motionSleep) {
      if (payload === true) {
        if (this.sleeping) {
          this.show(this.config.animationSpeed);
        } else {
          clearTimeout(this.sleepTimer);
          this.sleepTimer = setTimeout(function () {
            self.hide(self.config.animationSpeed);
          }, self.config.motionSleepSeconds * 1000);
        }
      }
    }
  },

  socketNotificationReceived: function (notification, payload) {
    var self = this;

    if (notification === "MMM_HUE_LIGHTS_DATA") {
      self.processHueData(payload);
    } else if (notification === "MMM_HUE_LIGHTS_DATA_ERROR") {
      self.errMsg = payload;
      self.updateDom(self.config.animationSpeed);
    }
    self.scheduleUpdate(self.config.updateInterval);
  },

  suspend: function () {
    // this method is triggered when a module is hidden using this.hide()

    this.sleeping = true;
  },

  resume: function () {
    // this method is triggered when a module is shown using this.show()

    var self = this;

    if (this.sleeping) {
      this.sleeping = false;

      // get new data
      this.getData();

      // restart timer
      if (this.config.motionSleep) {
        clearTimeout(this.sleepTimer);
        this.sleepTimer = setTimeout(function () {
          self.hide(self.config.animationSpeed);
        }, self.config.motionSleepSeconds * 1000);
      }
    }
  },

  processHueData: function (data) {
    var self = this;

    var displayMode = this.config.displayMode;
    var displayFilter = this.config.displayFilter;
    var hideFilter = this.config.hideFilter;

    var renderUi = true;
    var forceRender = false;

    var oldLights = this.lights;
    var oldGroups = this.groups;
    var numberOfOldLights = Object.keys(oldLights).length;
    var numberOfOldGroups = Object.keys(oldGroups).length;

    var lights = data.lights;
    var groups = data.groups;

    // for the groups, let's immediately filter out anything that doesn't have a type of 'Room'

    Object.keys(data.groups).forEach(function (key) {
      var itemType = data.groups[key].type.toLowerCase();
      if (itemType !== "room") {
        delete data.groups[key];
      }
    });

    var itemsToFilter = displayMode === "lights" ? lights : groups;
    var itemsFilteredOut = 0;

    // check for positive filtering

    if (this.isArray(displayFilter)) {
      if (displayFilter.length > 0) {
        // if the array is empty, we'll assume they want to see all lights/groups

        if (displayFilter[0] !== "all") {
          Object.keys(itemsToFilter).forEach(function (key) {
            var itemName = itemsToFilter[key].name.toLowerCase();
            var deleteItem = true;

            for (i = 0; i < displayFilter.length; i++) {
              var filterString = displayFilter[i].toLowerCase().trim();
              if (itemName.indexOf(filterString) > -1) {
                // this should NOT be filtered out
                deleteItem = false;
              }
            }

            if (deleteItem) {
              itemsFilteredOut++;
              delete itemsToFilter[key];
            }
          });
        }
      }
    } else if (this.isString(displayFilter)) {
      // we will be nice and assume the user meant for this to be an array with the string inside it

      if (displayFilter !== "all") {
        // filter based on the string

        var filterString = displayFilter.toLowerCase().trim();

        Object.keys(itemsToFilter).forEach(function (key) {
          var itemName = itemsToFilter[key].name.toLowerCase();
          if (itemName.indexOf(filterString) < 0) {
            // this should be filtered out
            itemsFilteredOut++;
            delete itemsToFilter[key];
          }
        });
      }
    }

    // check for negative filtering

    if (this.isArray(hideFilter)) {
      if (hideFilter.length > 0) {
        Object.keys(itemsToFilter).forEach(function (key) {
          var itemName = itemsToFilter[key].name.toLowerCase();
          var deleteItem = false;

          for (i = 0; i < hideFilter.length; i++) {
            var filterString = hideFilter[i].toLowerCase().trim();
            if (itemName.indexOf(filterString) > -1) {
              // this should be filtered out
              deleteItem = true;
            }
          }

          if (deleteItem) {
            itemsFilteredOut++;
            delete itemsToFilter[key];
          }
        });
      }
    }

    var numberOfLights = lights ? Object.keys(data.lights).length : 0;
    var numberOfGroups = groups ? Object.keys(data.groups).length : 0;

    // check if lights of each group is reachable
    // no reachable lights will be "marked" as off
    Object.values(data.groups).forEach(function (group, index) {
      var numberOfLightsInGroup = group.lights.length;
      var any_on = false;

      for (var i = 0; i < numberOfLightsInGroup; i++) {
        var hueLightID = group.lights[i];

        if (data.lights[hueLightID].state.reachable == false) {
          // if light is not reachable
          data.lights[hueLightID].state.on = false;
          group.state.all_on = false;
          forceRender = true;
        } else {
          if (data.lights[hueLightID].state.on == true) {
            any_on = true;
          }
        }
      }

      group.state.any_on = any_on;
    });

    // check old data to make sure we're not re-rendering the UI for no reason
    if (this.loaded) {
      if (numberOfOldLights !== numberOfLights) {
        // number of lights changed (update dom)
      } else if (numberOfOldGroups !== numberOfGroups) {
        // number of groups changed (update dom)
      } else if (forceRender) {
        // force render (update dom)
      } else {
        // compare status of lights
        if (
          this.jsonEqual(oldLights, lights) &&
          this.jsonEqual(oldGroups, groups)
        ) {
          renderUi = false;
        }
      }
    }

    this.loaded = true;
    this.lights = lights;
    this.groups = groups;

    if (renderUi) {
      if (itemsFilteredOut > 0) {
        if (displayMode === "lights" && numberOfLights === 0) {
          this.errMsg =
            "No Hue lights were found<br>with the filter(s) you specified.";
        } else if (displayMode === "groups" && numberOfGroups === 0) {
          this.errMsg =
            "No Hue light groups were found<br>with the filter(s) you specified.";
        }
      } else if (displayMode === "lights" && numberOfLights === 0) {
        this.errMsg = "You have no Hue lights.";
      } else if (displayMode === "groups" && numberOfGroups === 0) {
        this.errMsg = "You have no Hue light groups.";
      } else {
        this.errMsg = "";
      }

      this.updateDom(this.config.animationSpeed);
    }
  },

  getHueColorStyle: function (item) {
    /*

        Hue lights use HSB color space for colormode ct, not RGB
        This is used for regular color light bulbs

        item.state.hue = The hue value to set light to. The hue value is a wrapping value between 0 and 65535. Both 0 and 65535 are red, 25500 is green and 46920 is blue.
        item.state.bri = Brightness of the light. This is a scale from the minimum brightness the light is capable of, 1, to the maximum capable brightness, 254.
        item.state.sat = Saturation of the light. 254 is the most saturated (colored) and 0 is the least saturated (white).

        Hue lights use CIE color space for colormode xy
        This is used for color lightstrips and blooms

        item.state.xy = The x and y coordinates of a color in CIE color space.The first entry is the x coordinate and the second entry is the y coordinate. Both x and y must be between 0 and 1.

        item.state.colormode = Indicates the color mode in which the light is working, this is the last command type it received. Values are “hs” for Hue and Saturation, “xy” for XY and “ct” for Color Temperature. This parameter is only present when the light supports at least one of the values.

        */

    var colorRgb = false;
    var colorHex = false;
    var colorStyle = false;

    if (item.state.colormode && item.state.xy && item.state.bri) {
      // colored light, with x, y, and bri values
      colorRgb = this.XYtoRGB(
        item.state.xy[0],
        item.state.xy[1],
        item.state.bri
      );
      colorHex = this.rgbToHex(colorRgb);
      if (colorHex !== "#000000") {
        colorStyle =
          "color: " + colorHex + "; border-color: " + colorHex + " !important;";
      }
    } else if (item.state.bri) {
      // white light with bri value
      // just a hacky conversion to show brightness
      var bri = Math.floor((100 / 255) * item.state.bri);
      if (bri > 0) {
        if (bri > 98) {
          bri = "1";
        } else {
          bri = "0." + bri;
        }
        colorStyle = "color: #fff; opacity: " + bri + ";";
      }
    }

    return {
      colorHex,
      colorStyle,
      colorRgb,
    };
  },

  isString: function (val) {
    return typeof val === "string" || val instanceof String;
  },

  isArray: function (val) {
    return Array.isArray(val);
  },

  // https://github.com/JedWatson/classnames/
  classNames: function () {
    var classes = [];

    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (!arg) continue;

      var argType = typeof arg;

      if (argType === "string" || argType === "number") {
        classes.push(arg);
      } else if (Array.isArray(arg) && arg.length) {
        var inner = classNames.apply(null, arg);
        if (inner) {
          classes.push(inner);
        }
      } else if (argType === "object") {
        for (var key in arg) {
          if (hasOwn.call(arg, key) && arg[key]) {
            classes.push(key);
          }
        }
      }
    }

    return classes.join(" ");
  },

  jsonEqual: function (a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  },

  XYtoRGB: function (x, y, brightness) {
    // convert X, Y, bri colors to RGB

    if (brightness === undefined) {
      brightness = 254;
    }

    var z = 1.0 - x - y;
    var Y = brightness;
    //var Y = (brightness / 254).toFixed(2);
    var X = (Y / y) * x;
    var Z = (Y / y) * z;

    // convert to RGB using Wide RGB D65 conversion
    var red = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    var green = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    var blue = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

    // if red, green or blue is larger than 1.0 set it back to the maximum of 1.0
    if (red > blue && red > green && red > 1.0) {
      green = green / red;
      blue = blue / red;
      red = 1.0;
    } else if (green > blue && green > red && green > 1.0) {
      red = red / green;
      blue = blue / green;
      green = 1.0;
    } else if (blue > red && blue > green && blue > 1.0) {
      red = red / blue;
      green = green / blue;
      blue = 1.0;
    }

    // reverse gamma correction
    red =
      red <= 0.0031308
        ? 12.92 * red
        : (1.0 + 0.055) * Math.pow(red, 1.0 / 2.4) - 0.055;
    green =
      green <= 0.0031308
        ? 12.92 * green
        : (1.0 + 0.055) * Math.pow(green, 1.0 / 2.4) - 0.055;
    blue =
      blue <= 0.0031308
        ? 12.92 * blue
        : (1.0 + 0.055) * Math.pow(blue, 1.0 / 2.4) - 0.055;

    if (red > blue && red > green) {
      // red is biggest
      if (red > 1.0) {
        green = green / red;
        blue = blue / red;
        red = 1.0;
      }
    } else if (green > blue && green > red) {
      // green is biggest
      if (green > 1.0) {
        red = red / green;
        blue = blue / green;
        green = 1.0;
      }
    } else if (blue > red && blue > green) {
      // blue is biggest
      if (blue > 1.0) {
        red = red / blue;
        green = green / blue;
        blue = 1.0;
      }
    }

    // convert normalized decimal to decimal
    red = Math.round(red * 255);
    green = Math.round(green * 255);
    blue = Math.round(blue * 255);

    if (isNaN(red)) {
      red = 0;
    }

    if (isNaN(green)) {
      green = 0;
    }

    if (isNaN(blue)) {
      blue = 0;
    }

    if (red < 0) {
      red = 0;
    }

    if (green < 0) {
      green = 0;
    }

    if (blue < 0) {
      blue = 0;
    }

    return {
      r: red,
      g: green,
      b: blue,
    };
  },

  luminanace: function (r, g, b) {
    var a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  },

  contrast: function (rgb1, rgb2) {
    l1 = this.luminanace(rgb1[0], rgb1[1], rgb1[2]) + 0.05;
    l2 = this.luminanace(rgb2[0], rgb2[1], rgb2[2]) + 0.05;

    return Math.max(l1, l2) / Math.min(l1, l2);
  },

  rgbToHsl: function (c) {
    var r = c[0] / 255,
      g = c[1] / 255,
      b = c[2] / 255;
    var max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return new Array(h * 360, s * 100, l * 100);
  },

  colorDistance: function (color1, color2) {
    // This is actually the square of the distance but this doesn't matter for sorting.
    var result = 0;
    for (var i = 0; i < color1.length; i++) {
      result += (color1[i] - color2[i]) * (color1[i] - color2[i]);
    }
    return result;
  },

  sortColors: function (colors) {
    // Calculate distance between each color

    var distances = [];

    for (var i = 0; i < colors.length; i++) {
      distances[i] = [];
      for (var j = 0; j < i; j++) {
        distances.push([
          colors[i],
          colors[j],
          this.colorDistance(colors[i], colors[j]),
        ]);
      }
    }

    distances.sort(function (a, b) {
      return a[2] - b[2];
    });

    // Put each color into separate cluster initially
    var colorToCluster = {};
    for (var i = 0; i < colors.length; i++) {
      colorToCluster[colors[i]] = [colors[i]];
    }

    // Merge clusters, starting with lowest distances
    var lastCluster;

    for (var i = 0; i < distances.length; i++) {
      var color1 = distances[i][0];
      var color2 = distances[i][1];

      var cluster1 = colorToCluster[color1];
      var cluster2 = colorToCluster[color2];

      if (!cluster1 || !cluster2 || cluster1 == cluster2) continue;

      // Make sure color1 is at the end of its cluster and
      // color2 at the beginning.
      if (color1 != cluster1[cluster1.length - 1]) {
        cluster1.reverse();
      }

      if (color2 != cluster2[0]) {
        cluster2.reverse();
      }

      // Merge cluster2 into cluster1
      cluster1.push.apply(cluster1, cluster2);

      delete colorToCluster[color1];
      delete colorToCluster[color2];

      colorToCluster[cluster1[0]] = cluster1;
      colorToCluster[cluster1[cluster1.length - 1]] = cluster1;

      lastCluster = cluster1;
    }

    // By now all colors should be in one cluster
    return lastCluster;
  },

  rgbToHex: function (rgb) {
    // when rgb is an object
    return (
      "#" +
      ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)
    );
  },

  rgbToHexAlt: function (rgb) {
    // when rgb is an array
    return (
      "#" +
      ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2])
        .toString(16)
        .slice(1)
    );
  },

  scheduleUpdate: function (delay) {
    var nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }

    var self = this;
    setTimeout(function () {
      self.getData();
    }, nextLoad);
  },
});
