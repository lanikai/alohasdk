package com.alohartc;

import static java.time.temporal.ChronoUnit.MINUTES;

import java.time.Instant;

import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.JWT;

public class NewToken {
    public static void main(String[] args) {
        String deviceId = System.getenv("DEVICE_ID");
        String jwtIssuer = System.getenv("JWT_ISSUER");
        String jwtSubject = System.getenv("JWT_SUBJECT");
        String jwtSecret = System.getenv("JWT_SECRET");

        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
        String token = JWT.create()
            .withIssuer(jwtIssuer)
            .withSubject(jwtSubject)
            .withExpiresAt(java.util.Date.from(Instant.now().plus(30, MINUTES)))
            .withArrayClaim("grants", new String[]{"connect:device:" + deviceId})
            .sign(algorithm);

        System.out.println(token);
    }
}
