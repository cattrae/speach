"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Speach = function () {
  function Speach(afterAPILoaded) {
    _classCallCheck(this, Speach);

    this.browserSupportsFeature = this.browserSupportsFeature();
    if (!this.browserSupportsFeature) {
      console.warn("Your browser does not support the Speech Synthesis API 😔");
      return;
    }
    this._voice = null;
    this.utterances = {};
    this.loadAPI();
  }

  // Check whether the browser supports the API.


  _createClass(Speach, [{
    key: "browserSupportsFeature",
    value: function browserSupportsFeature() {
      return "speechSynthesis" in window;
    }

    // The SpeechSynthesis API in some browsers needs to be loaded,
    // and in some not.

  }, {
    key: "loadAPI",
    value: function loadAPI() {
      var _this = this;

      this.promiseChain = new Promise(function (resolve, reject) {
        if (!_this.browserSupportsFeature) {
          resolve();
        }
        if (speechSynthesis.getVoices().length) {
          _this.voices = speechSynthesis.getVoices();
          resolve();
        } else {
          speechSynthesis.addEventListener("voiceschanged", function () {
            _this.voices = speechSynthesis.getVoices();
            resolve();
          });
        }
      });
    }

    // Set the voice for the next text to speak.

  }, {
    key: "voice",
    value: function voice(name) {
      var _this2 = this;

      if (!this.browserSupportsFeature) {
        return;
      }
      this.promiseChain = this.promiseChain.then(function () {
        var found = _this2.voices.find(function (voice) {
          return voice.name === name;
        });
        if (!found) {
          found = _this2.voices.find(function (voice) {
            return voice.default;
          });
        }
        _this2._voice = found;
        return;
      });
    }

    // Speak the provided text.

  }, {
    key: "speak",
    value: function speak(textToSpeak) {
      var _this3 = this;

      if (!this.browserSupportsFeature) {
        return;
      }
      this.promiseChain = this.promiseChain.then(function () {
        return new Promise(function (resolve, reject) {
          var utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.voice = _this3._voice;
          speechSynthesis.speak(utterance);

          // Store the utterance to ensure its onend event fires in Chrome.
          // See https://bugs.chromium.org/p/chromium/issues/detail?id=509488
          var createdAt = new Date().getTime();
          _this3.utterances[createdAt] = utterance;

          utterance.onend = function (evt) {
            delete _this3.utterances[createdAt];
            resolve();
          };
        });
      });
    }

    // Put a callback onto the current Promise chain.

  }, {
    key: "then",
    value: function then(onFulfilled, onRejected) {
      if (!this.browserSupportsFeature) {
        return;
      }
      this.promiseChain = this.promiseChain.then(onFulfilled, onRejected);
    }
  }]);

  return Speach;
}();

// A factory function which uses the Module patern
// to expose a limited public API.


var speach = function speach() {
  var speach = new Speach();
  return {
    voice: function voice(name) {
      speach.voice(name);
      return this;
    },
    speak: function speak(textToSpeak) {
      speach.speak(textToSpeak);
      return this;
    },
    then: function then(onFulfilled, onRejected) {
      speach.then(onFulfilled, onRejected);
      return this;
    }
  };
};

exports.default = speach;
