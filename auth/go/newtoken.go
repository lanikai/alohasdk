package main

import (
	"fmt"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
)

var (
	deviceID   = os.Getenv("DEVICE_ID")
	jwtIssuer  = os.Getenv("JWT_ISSUER")
	jwtSubject = os.Getenv("JWT_SUBJECT")
	jwtSecret  = []byte(os.Getenv("JWT_SECRET"))
)

func main() {
	signingMethod := jwt.SigningMethodHS256
	claims := jwt.MapClaims{
		"iss":    jwtIssuer,
		"sub":    jwtSubject,
		"exp":    time.Now().Add(30 * time.Minute).Unix(),
		"grants": []string{"connect:device:" + deviceID},
	}
	token, err := jwt.NewWithClaims(signingMethod, claims).SignedString(jwtSecret)
	if err != nil {
		panic(err)
	}
	fmt.Println(token)
}
