from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
import base64

# Your sandbox initiator password
initiator_password = b"testapi"

# Sandbox public key (works for sandbox B2C)
public_key_pem = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvJ2W+y6j6gD3kZ7g0VdB
SPl/UbTjUe5WvD8/0uEV4DPLuyrV17E+b8L3+G7mHhjPx3j0kQl2UfbJgN03VJkG
M5Gq9QKx5kI/TpMBoVqPy1wX3/6RoGjHe4NVKZPz3jKdyzDzW7r1b1oItkR2RRLb
pPQkZlB6AUpgG+/b4jQhv4/I0px9Xz7hIp7YH4V+OqMnDzIY/IGCk8O7sRixn0Ei
7k+J7hMk2xYk3QdnwTQ6sW2wFVlTKh6Jw6dy/ab3LBo2d4NfG9iAUnIob1u1xAbR
ljPw1r2mWpeD8clzE7V6ePvP4r1oJHFeIUGvA3Fj6r3dE1K2Hg/e0jYHjIJuP5J5
rwIDAQAB
-----END PUBLIC KEY-----"""

# Load the public key
public_key = serialization.load_pem_public_key(public_key_pem)

# Encrypt the password
encrypted = public_key.encrypt(
    initiator_password,
    padding.PKCS1v15()
)

# Convert to Base64
security_credential = base64.b64encode(encrypted).decode()

print("Your B2C Security Credential:")
print(security_credential)