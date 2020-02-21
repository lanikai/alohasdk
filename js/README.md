# alohasdk.js

`alohasdk.js` is a client library for viewing AlohaRTC video streams directly in
the browser. See the [Documentation](https://docs.alohartc.com) for details.


## Getting started

`alohasdk.js` is distributed as an NPM module. Add it to your project with:
```console
npm install --save @lanikai/alohasdk.js
```

In your JavaScript code, import the module and invoke the `Connect` function:
```javascript
import * as alohasdk from '@lanikai/alohasdk.js';

...

let pc = alohasdk.Connect({
    deviceId: 'some-device-id',
    authToken: 'some-auth-token',
    remoteVideo: someVideoElement,
});
```
This returns a
[RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
object in the `connecting` state. If the connection succeeds, the device's video
stream will start playing in the provided `<video>` element.

Note: The source code uses ES6 module syntax, which (as of 2019) is supported
natively in most mainstream browsers. If you need to support older browser
versions, you can use [Babel](https://babeljs.io/) to transpile to older syntax.


## Example

The `example.html` file contains a simple standalone example, where you paste in
the device ID that you want to connect to. Just run `npm install` followed by
```console
npm run example
```
from your terminal to try it out.
