# AlohaSDK example - client auth using Go

Shows how to create an AlohaRTC client auth token in Go, using the
[github.com/dgrijalva/jwt-go](https://github.com/dgrijalva/jwt-go) library.
(See [jwt.io](https://jwt.io) for a list of alternative JWT libraries.)

## Usage

```sh
# Set DEVICE_ID, JWT_ISSUER, JWT_SUBJECT, and JWT_SECRET environment variables.
go run newtoken.go
```
