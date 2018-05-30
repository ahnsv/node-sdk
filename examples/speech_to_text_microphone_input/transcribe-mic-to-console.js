'use strict';
require('dotenv').config({ silent: true }); // optional, handy for local development
var SpeechToText = require('watson-developer-cloud/speech-to-text/v1');
var mic = require('mic'); // the `mic` package also works - it's more flexible but requires a bit more setup
var wav = require('wav');

var speechToText = new SpeechToText({
  "url": "https://stream.watsonplatform.net/speech-to-text/api",
  "username": "04a56161-1317-4f28-bcef-59afe4988f03",
  "password": "QH7FROzRMV1u"
});

var micInstance = mic({
  rate: '16000',
  channels: '1',
  debug: true,
  exitOnSilence: 6
});
var micInputStream = micInstance.getAudioStream(); // 2-channel 16-bit little-endian signed integer pcm encoded audio @ 44100 Hz

var wavStream = new wav.Writer({
  sampleRate: 44100,
  channels: 2,
});

var recognizeStream = speechToText.createRecognizeStream({
  content_type: 'audio/wav',
});

micInputStream.pipe(wavStream);

wavStream.pipe(recognizeStream);

recognizeStream.pipe(process.stdout);

// note:
// If you just kill the process with control-c, the .wav file will have an incorrect header, and any in-flight
// transcription will be lost.
// This allows for a graceful termination of the recording, and the process will automatically exit after everything is
// complete.
console.log('Recording, press any key to exit');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.once('data', function() {
  console.log('Cleaning up and exiting...');
  process.stdin.setRawMode(false);
  micInstance.stop();
  recognizeStream.on('end', function() {
    process.exit();
  });
});

micInstance.start();
