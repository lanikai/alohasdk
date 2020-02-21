# AlohaSDK example - client auth using PHP

Shows how to create an AlohaRTC client auth token in PHP, using the
[lcobucci/jwt v3.3](https://github.com/lcobucci/jwt/tree/3.3) library. (See
[jwt.io](https://jwt.io) for a list of alternative JWT libraries.)


## Usage

```sh
# Set DEVICE_ID, JWT_ISSUER, JWT_SUBJECT, and JWT_SECRET environment variables.
composer install
php newtoken.php
```
