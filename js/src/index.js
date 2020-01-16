// Start a WebRTC call to a remote device. Takes an options object (see below).
//
// Returns a promise that resolves to an RTCPeerConnection instance, which
// should be close()'d when the call is terminated.
//
// Options:
//   authToken: Client authentication token. (Required)
//   deviceId: Which device to connect to. (Required)
//   remoteVideo: <video> element for displaying remote video stream. (Required)
//   iceServers: STUN/TURN servers to use for ICE (defaults to STUN only).
//   log: Debug logging function (default window.console.log).
export function Call(opts) {
  if (!opts) {
    throw "no options supplied";
  }
  if (!opts.authToken) {
    throw "no authToken supplied";
  }
  if (!opts.deviceId) {
    throw "deviceId option is required";
  }
  if (!opts.log) {
    opts.log = console.log;
  }
  var log = opts.log;

  // Initialize WebSocket connection to signaling server.
  var signalServer = opts.signalServer || 'https://api.oahu.lanikailabs.com';
  var url = signalServer.replace(/^http/, 'ws') + '/devices/' + opts.deviceId + '/call';

  return new Promise(function(resolve, reject) {
    var pc;
    var ws = new WebSocket(url);
    ws.onopen = function() {
      log("WebSocket opened:", url);

      // Authenticate by sending the client auth token. This must be the very
      // first message on the WebSocket.
      sendMessage(ws, 'auth-token', opts.authToken);

      if (opts.iceServers) {
        // Use client-provided ICE servers. This means we can start collecting
        // ICE candidates right away.
        pc = makePeerConnection(ws, opts);
      } else {
        // Otherwise, wait for the signal server to provide us TURN credentials.
        // TODO: Once https://bugzilla.mozilla.org/show_bug.cgi?id=1253706 is
        // fixed, we may be able to start ICE now and call pc.setConfiguration
        // once we have a TURN credential.
        sendMessage(ws, 'request-turn', '');
      }
    };

    ws.onmessage = function(e) {
      var msg = parseMessage(e.data);
      log("Received WebSocket message:", msg);
      switch (msg.what) {
        case 'turn':
          opts.iceServers = [
            JSON.parse(msg.body),
            { urls: ['stun:stun.l.google.com:19302'] },
          ];
          pc = makePeerConnection(ws, opts);
          break;
        case 'sdp-answer':
          pc.setRemoteDescription({ type: 'answer', sdp: msg.body })
            .then(function() {
              log("setRemoteDescription success");
              resolve(pc);
            })
            .catch(function(error) {
              log("setRemoteDescription failure:", error);
              reject(error);
            });
          break;
        case 'ice-candidate':
          var c = {};
          // The body is either a JSON object (new format) or a newline-delimited
          // set of fields (old format).
          if (msg.body.startsWith('{')) {
            c = JSON.parse(msg.body);
          } else {
            var lines = msg.body.split('\n');
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i];
              if (!line) {
                continue;
              } else if (line.startsWith('candidate:')) {
                c.candidate = line;
              } else if (line.startsWith('mid:')) {
                c.sdpMid = line.slice(4);
              } else {
                log("Unrecognized 'ice-candidate' line:", line);
              }
            }
          }
          if (c.candidate) {
            log("New remote ICE candidate:", c);
          } else {
            log("End of remote ICE candidates");
            c = null;
          }
          pc.addIceCandidate(c)
            .catch(function(error) {
              log("addIceCandidate failure:", error);
            });
          break;
      }
    };

    ws.onerror = function(e) {
      log("WebSocket error");
      reject(e);
    };

    ws.onclose = function(e) {
      log("WebSocket closed:", url, e.code, e.reason);
    };
  });
}

// Initialize an RTCPeerConnection object and send the initial SDP offer.
function makePeerConnection(ws, opts) {
  var log = opts.log;
  var pc = new RTCPeerConnection({
    iceServers: opts.iceServers,
    iceTransportPolicy: opts.iceTransportPolicy || "all",
  });

  pc.onconnectionstatechange = function() {
    log("New RTC connection state:", pc.connectionState);
  };

  pc.onicegatheringstatechange = function() {
    log("New ICE gathering state:", pc.iceGatheringState);
  };

  pc.oniceconnectionstatechange = function() {
    log("New ICE connection state:", pc.iceConnectionState);
  };

  pc.onsignalingstatechange = function() {
    log("New signaling state:", pc.signalingState);
  };

  pc.ontrack = function(e) {
    log("Received remote video stream");
    if (opts.remoteVideo && opts.remoteVideo.srcObject !== e.streams[0]) {
      opts.remoteVideo.srcObject = e.streams[0];
    }
  };

  pc.onicecandidate = function(e) {
    // Inform the remote ICE agent of the local candidate.
    var c = e.candidate;
    if (c) {
      log("New local ICE candidate:", c);
      sendMessage(ws, 'ice-candidate', c.candidate + '\nmid:' + c.sdpMid + '\n');
    } else {
      log("End of local ICE candidates");
      sendMessage(ws, 'ice-candidate', '');
    }
  };

  // Create WebRTC offer and send it to the remote peer.
  pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: true })
    .then(function(offer) {
      log("createOffer success:\n%s", offer.sdp);
      pc.setLocalDescription(offer);
      sendMessage(ws, 'sdp-offer', offer.sdp);
    })
    .catch(function(error) {
      log("createOffer failure:", error);
    });

  return pc;
}

// Monitor for status updates from devices. Takes an options object. The
// onStatus option is a callback function that will be invoked on every status
// update.
//
// Returns a connected WebSocket object, which the caller may close() to stop
// receiving updates.
//
// Options:
//   authToken: Client authentication token. (Required)
//   onStatus: Callback function, taking a DeviceStatusEvent. (Required)
//   deviceId or groupName: Device ID or group name to listen to. (Required)
//   log: Debug logging function (default window.console.log).
export function Monitor(opts) {
  if (!opts) {
    throw "no options supplied";
  }
  if (!opts.authToken) {
    throw "no authToken supplied";
  }
  if (!opts.onStatus) {
    throw "no onStatus callback supplied";
  }
  var endpoint;
  if (opts.deviceId) {
    endpoint = '/v1/monitor/device/' + opts.deviceId;
  } else if (opts.groupName) {
    endpoint = '/v1/monitor/group/' + opts.groupName;
  } else {
    throw "no device or group specified";
  }
  var log = opts.log || console.log;

  // Initialize WebSocket connection.
  var server = opts.server || 'https://api.oahu.lanikailabs.com';
  var url = server.replace(/^http/, 'ws') + endpoint;
  var ws = new WebSocket(url);

  ws.onopen = function() {
    log("WebSocket opened:", url);

    // Authenticate by sending the client auth token. This must be the very
    // first message on the WebSocket.
    sendMessage(ws, 'auth-token', opts.authToken);
  };

  ws.onclose = function(e) {
    log("WebSocket closed:", url, e.code, e.reason);
  };

  ws.onmessage = function(e) {
    var msg = parseMessage(e.data);
    switch (msg.what) {
      case 'device-status':
        var statusEvent = new DeviceStatusEvent(JSON.parse(msg.body));
        opts.onStatus(statusEvent);
        break;
      default:
        log("Unexpected WebSocket message:", msg)
        break;
    }
  };

  return ws;
}

// deviceId: globally unique device identifier
// online: boolean indicating whether the device is online or offline
// since: when the device status (online/offline) last changed
function DeviceStatusEvent(obj) {
  console.assert(typeof obj.deviceId === 'string');
  console.assert(typeof obj.online === 'boolean');
  if (typeof obj.since === 'string') {
    obj.since = new Date(obj.since);
  }
  console.assert(typeof obj.since === 'object');
  return obj;
}

// Split the given string into its first line (without the newline character)
// plus the remainder. E.g. 'abc\ndef\ng' => {what: 'abc', body: 'def\ng'}
function parseMessage(s) {
  var i = s.indexOf('\n');
  if (i < 0) {
    return {what: s, body: ''};
  } else {
    return {what: s.slice(0, i), body: s.slice(i+1)};
  }
}

// Send a message on the WebSocket connection.
function sendMessage(ws, what, body) {
  if (typeof body === 'object') {
    body = JSON.stringify(object);
  }
  ws.send(what + '\n' + body);
};

var defaultIceServers = [
  {
    urls: ['stun:stun.l.google.com:19302']
  },
];
