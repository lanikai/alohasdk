#!/usr/bin/env php
<?php
require 'vendor/autoload.php';

$deviceId = getenv('DEVICE_ID');
$jwtIssuer = getenv('JWT_ISSUER');
$jwtSubject = getenv('JWT_SUBJECT');
$jwtSecret = getenv('JWT_SECRET');

// Example based on lcobucci/jwt v3.3 (latest stable at time of writing).
use Lcobucci\JWT;

$signer = new JWT\Signer\Hmac\Sha256();
$key = new JWT\Signer\Key($jwtSecret);

$now = time();
$token = (new JWT\Builder())->issuedBy($jwtIssuer)
                            ->relatedTo($jwtSubject)
                            ->expiresAt($now + 30*60)
                            ->withClaim('grants', array('connect:device:' . $deviceId))
                            ->getToken($signer, $key);

echo $token . "\n";

?>
