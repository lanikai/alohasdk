# AlohaSDK example - client auth using Python 3

Shows how to create an AlohaRTC client auth token in Python, using the
[PyJWT](https://pyjwt.readthedocs.io) library. (See [jwt.io](https://jwt.io) for
a list of alternative JWT libraries.)

## Usage

```sh
# Set DEVICE_ID, JWT_ISSUER, JWT_SUBJECT, and JWT_SECRET environment variables.
python3 -m pip install --user pyjwt  # installs to $HOME/.local/pip/
python3 newtoken.py
```
