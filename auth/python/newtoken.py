#!/usr/bin/python3

import os

# Configuration via environment variables.
device_id = str(os.getenv("DEVICE_ID"))
jwt_issuer = os.getenv("JWT_ISSUER")
jwt_subject = os.getenv("JWT_SUBJECT")
jwt_secret = os.getenv("JWT_SECRET")


from datetime import datetime, timedelta

import jwt 

now = datetime.utcnow()
claims = {
    "iss": jwt_issuer,
    "sub": jwt_subject,
    "exp": now + timedelta(minutes=30),
    "grants": ["connect:device:" + device_id],
}
token = jwt.encode(claims, jwt_secret, algorithm="HS256").decode("utf-8")

print(token)
