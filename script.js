class Speach {
  constructor(afterAPILoaded) {
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
  browserSupportsFeature() {
    return "speechSynthesis" in window;
  }

  // The SpeechSynthesis API in some browsers needs to be loaded,
  // and in some not.
  loadAPI() {
    this.promiseChain = new Promise((resolve, reject) => {
      if (!this.browserSupportsFeature) {
        resolve();
      }
      if (speechSynthesis.getVoices().length) {
        this.voices = speechSynthesis.getVoices();
        this.voice();
        resolve();
      } else {
        speechSynthesis.addEventListener("voiceschanged", () => {
          this.voices = speechSynthesis.getVoices();
          this.voice();
          resolve();
        });
      }
    });
  }

  // Set the voice for the next text to speak.
  voice(name) {
    if (!this.browserSupportsFeature) {
      return;
    }
    this.promiseChain = this.promiseChain.then(() => {
      let found = this.voices.find(voice => voice.name === name);
      if (!found) {
        found = this.voices.find(voice => voice.default);
      }
      this._voice = found;
      return;
    });
  }

  // Speak the provided text.
  speak(textToSpeak) {
    if (!this.browserSupportsFeature) {
      return;
    }
    this.promiseChain = this.promiseChain.then(() => {
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.voice = this._voice;
        speechSynthesis.speak(utterance);

        // Store the utterance to ensure its onend event fires in Chrome.
        // See https://bugs.chromium.org/p/chromium/issues/detail?id=509488
        const createdAt = new Date().getTime();
        this.utterances[createdAt] = utterance;

        utterance.onend = evt => {
          delete this.utterances[createdAt];
          resolve();
        };
      });
    });
  }

  // Pass whatever is offered to the Promise chain.
  then(thenable) {
    if (!this.browserSupportsFeature) {
      return;
    }
    this.promiseChain = this.promiseChain.then(thenable);
  }
}

// A factory function so we only expose a shallow object as the public API
// which proxies function calls to the Speaker class.
const speach = () => {
  const speach = new Speach();
  return {
    voice(name) {
      speach.voice(name);
      return this;
    },
    speak(textToSpeak) {
      speach.speak(textToSpeak);
      return this;
    },
    then(thenable) {
      speach.then(thenable);
      return this;
    }
  };
};

export default speach;