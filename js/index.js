// Start a WebRTC call to a remote device. Takes a dictionary of options.
// Returns an RTCPeerConnection object, which should be close()'d when the call
// is terminated.
//
// Required options:
//   deviceId: Which device to connect to.
//   authToken: Authentication token provided by Oahu backend.
//   remoteVideo: <video> element where remote video should be displayed.
// Additional options:
//   signalServer: Signaling server URL (default 'wss://api.oahu.lanikailabs.com').
//   iceServers: STUN/TURN servers to use for ICE (default STUN only).
//   log: Debug logging function (default window.console.log).
export function Call(opts) {
  if (!opts) {
    throw "no options supplied";
  }
  if (!opts.deviceId) {
    throw "deviceId option is required";
  }
  var log = opts.log || console.log;

  // Initialize WebSocket connection to signaling server.
  var signalServer = opts.signalServer || 'wss://api.oahu.lanikailabs.com';
  var url = signalServer + '/devices/' + opts.deviceId + '/call';
  var ws = new WebSocket(url);

  // Initialize RTCPeerConnection object.
  var pc = new RTCPeerConnection({
    iceTransportPolicy: 'all',
    iceServers: opts.iceServers || defaultIceServers,
  });

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

  ws.onopen = function() {
    log("WebSocket opened");

    if (opts.authToken) {
      // Authenticate by sending the user's auth token. This must be the very
      // first message on the WebSocket.
      sendMessage(ws, 'auth-token', opts.authToken);
    }

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

  };

  ws.onmessage = function(e) {
    var msg = parseMessage(e.data);
    log("Received WebSocket message:", msg);
    switch (msg.what) {
      case 'sdp-answer':
        pc.setRemoteDescription({ type: 'answer', sdp: msg.body })
          .then(function() {
            log("setRemoteDescription success");
          })
          .catch(function(error) {
            log("setRemoteDescription failure:", error);
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

  ws.onerror = function() {
    log("WebSocket error");
  };

  ws.onclose = function(e) {
    log("WebSocket closed:", e.code, e.reason);
  };

  return pc;
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
  ws.send(what + '\n' + body);
};

var defaultIceServers = [
  {
    urls: ['stun:stun.l.google.com:19302']
  },
];
