(() => {
  const errorCodes = {
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3
  };
  class GeolocationPositionError extends Error {
    constructor(code, message) {
      super(
        code
          .split("_")
          .map(e => e[0] + e.slice(1).toLowerCase())
          .join(" ") +
          ": " +
          message
      );
      this.code = errorCodes[code];
    }
  }
  class GeolocationCoordinates {
    constructor(lat, lon) {
      this.latitude = lat;
      this.longitude = lon;
      this.altitude = null;
      this.accuracy = 32186; // 20 miles
      this.altitudeAccuracy = null;
      this.heading = null;
      this.speed = null;
    }
  }
  class GeolocationPosition {
    constructor(lat, lon) {
      this.coords = new GeolocationCoordinates(lat, lon);
      this.timestamp = new Date().valueOf();
    }
  }
  let getPosition = async function getPosition() {
    try {
      const { ok, position, message } = await (await fetch(
        "https://whereami.easrng.workers.dev/"
      )).json();
      if (!ok) throw new Error(message);
      getPosition = async () => new GeolocationPosition(...position);
      return new GeolocationPosition(...position);
    } catch (e) {
      throw new GeolocationPositionError("POSITION_UNAVAILABLE", e.message);
    }
  };
  class Geolocation { // TODO: clearWatch and watchPosition
    getCurrentPosition(success, error, options) {
      getPosition(options)
        .then(e => success(e))
        .catch(e => error(e));
    }
  }
  function enable() {
    window.GeolocationPositionError = GeolocationPositionError;
    window.GeolocationCoordinates = GeolocationCoordinates;
    window.GeolocationPosition = GeolocationPosition;
    window.Geolocation = Geolocation;
    let geo = new Geolocation();
    Object.defineProperty(navigator, "geolocation", {
      get: function() {
        return geo;
      }
    });
  }
  if (!navigator.geolocation) {
    enable();
  } else {
    let ogp = navigator.geolocation.getCurrentPosition;
    navigator.geolocation.getCurrentPosition = function(success, error, options) {
      if (!success)
        throw new TypeError(
          "Failed to execute 'getCurrentPosition' on 'Geolocation': 1 argument required, but only 0 present."
        );
      if (typeof success != "function")
        "Failed to execute 'getCurrentPosition' on 'Geolocation': parameter 1 is not of type 'Function'.";
      if (error)
        if (typeof error != "function")
          "Failed to execute 'getCurrentPosition' on 'Geolocation': parameter 2 is not of type 'Function'.";
      ogp.call(
        this,
        function internalSuccessCb(s) {
          success(s);
        },
        function internalErrorCb(e) {
          enable();
          navigator.geolocation.getCurrentPosition(success, error, options);
        },
        options
      );
    };
  }
})();
