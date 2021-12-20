let Service, Characteristic;
const http = require("http");
const packageJson = require("./package.json");

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    "homebridge-fibaro-security",
    "Homebridge-Fibaro-Security",
    HttpSecuritySystemAccessory
  );
};

function HttpSecuritySystemAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.ip = config["ip"];
  this.login = config["login"];
  this.password = config["password"];
  this.name_var = config["name_var"];
  this.pollerPeriod = config["pollerperiod"] || 0;

  //this.isPollerPeriod = false;
  this.STATE_OFF = Characteristic.SecuritySystemCurrentState.DISARMED;
  this.STATE_ALARM = Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED;
  this.ALL_STATES = ["HOME", "AWAY", "NIGHT", "OFF", "ALARM"];
  this.currentstate = this.STATE_OFF; // Default state - OFF
  this.prevstate = this.STATE_OFF; // Default state - OFF

  if (this.pollerPeriod > 0) {
    setInterval(
      function (self) {
        self.get_current_state(function (callback) {});
      },
      this.pollerPeriod,
      this
    );
  }
}

HttpSecuritySystemAccessory.prototype = {
  FibaroValue: function (command, value, callback) {
    const flag = command === "PUT";
    const options = {
      host: this.ip,
      path: "/api/globalVariables/" + this.name_var,
      method: command,
      auth: this.login + ":" + this.password,
      headers: { "Content-Type": "application/json" },
    };

    let req = http.request(options, function (res) {
      if (res.statusCode !== 200) {
        return callback("Response status was " + res.statusCode);
      }

      let result = "";
      res.on("data", function (data) {
        result += data;
      });
      res.on("end", function () {
        return callback(null, JSON.parse(result));
      });
    });

    req.on("error", function (e) {
      return callback("ERROR: " + e.message);
    });

    if (flag) {
      let json_req = { value: value.toString(), invokeScenes: true };
      req.write(JSON.stringify(json_req));
    }

    req.end();
  },

  setTargetState: function (state, callback) {
    this.FibaroValue(
      "PUT",
      state,
      function (err, data) {
        if (err) {
          this.log("Data retrieval error: %s", err);
        } else {
          this.log("The mode is set: %s", this.ALL_STATES[state]);
          //         this.prevstate = this.currentstate;
          this.currentstate = state;
          this.securityService.setCharacteristic(
            Characteristic.SecuritySystemCurrentState,
            state
          );
        }
      }.bind(this)
    );
    return callback(null);
  },

  get_current_state: function (callback) {
    this.FibaroValue(
      "GET",
      0,
      function (err, data) {
        if (err) {
          this.log("Data retrieval error: %s", err);
          return callback(err);
        } else {
          let state = parseInt(data.value);
          if (this.currentstate !== state) {
            this.log("Update state: %s", this.ALL_STATES[state]);

            if (state !== this.STATE_ALARM) {
              this.securityService.setCharacteristic(
                Characteristic.SecuritySystemTargetState,
                state
              );
            } else {
              this.prevstate = this.currentstate;
            }

            this.currentstate = state;

            this.securityService.setCharacteristic(
              Characteristic.SecuritySystemCurrentState,
              state
            );
          }

          return callback(null, state);
        }
      }.bind(this)
    );
  },

  get_target_state: function (callback) {
    const state =
      this.currentstate === this.STATE_ALARM
        ? this.prevstate
        : this.currentstate;
    return callback(null, state);
  },

  getCurrentState: function (callback) {
    this.get_current_state(callback);
  },

  getTargetState: function (callback) {
    this.get_target_state(callback);
  },

  getServices: function () {
    this.securityService = new Service.SecuritySystem(this.name);

    this.securityService
      .getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .on("get", this.getCurrentState.bind(this));

    this.securityService
      .getCharacteristic(Characteristic.SecuritySystemTargetState)
      .on("get", this.getTargetState.bind(this))
      .on("set", this.setTargetState.bind(this));

    this.info = new Service.AccessoryInformation();
    this.info
      .setCharacteristic(Characteristic.Manufacturer, "Oxystin")
      .setCharacteristic(Characteristic.Name, "Fibaro Alarm")
      .setCharacteristic(Characteristic.Model, "Security System")
      .setCharacteristic(Characteristic.SerialNumber, "Fibaro Security System")
      .setCharacteristic(Characteristic.FirmwareRevision, packageJson.version);

    return [this.securityService, this.info];
  },
};
