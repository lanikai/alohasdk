## Client auth examples

The examples in this directory illustrate how to generate AlohaRTC client auth
tokens, in several popular programming languages. Each example is structured as
a standalone program, which takes its input via environment variables and prints
the resulting auth token to `stdout`. For instance, the Go example can be
exercised as follows:
```console
$ export DEVICE_ID=<my-device-id>
$ export JWT_ISSUER=<auth-key-issuer>
$ export JWT_SUBJECT=<auth-key-subject>
$ export JWT_SECRET=<auth-key-secret>
$ cd go/
$ go run newtoken.go
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1ODIyNjA5MzcsImdyYW50cyI6WyJjb25uZWN0OmRldmljZTpcdTAwM2NteS1kZXZpY2UtaWRcdTAwM2UiXSwiaXNzIjoiXHUwMDNjYXV0aC1rZXktaXNzdWVyXHUwMDNlIiwic3ViIjoiXHUwMDNjYXV0aC1rZXktc3ViamVjdFx1MDAzZSJ9.grX5O2c29Fi6531ixiKvJO4-VPFUEGF8Xkrh677T-uI
```
(If using a shell other than Bash, replace `export` above with the appropriate
command.)

Note: Sometimes an extra newline sneaks in when trying to copy-paste from the
terminal. A properly formatted AlohaRTC auth token should not contain any
whitespace. You can inspect and verify the token using the JWT Debugger at
[JWT.io](https://jwt.io).


### Environment variable inputs

The meaning of the environment variables is as follows:

* `DEVICE_ID`: The device ID of an AlohaRTC device, e.g. `abcdefg12345`.
* `JWT_ISSUER`: The issuer ID of an AlohaRTC auth key, e.g. `123456789:my-key`.
* `JWT_SUBJECT`: The subject string for an AlohaRTC auth key, e.g.
  `project:123456789`. (This is currently optional, so you may choose to leave
  `JWT_SUBJECT` empty/unset.)
* `JWT_SECRET`: The shared secret of an AlohaRTC auth key. This is typically a
  long random string.

You can look up your device ID and auth key details on the [AlohaRTC
Dashboard](https://dashboard.alohartc.com).
