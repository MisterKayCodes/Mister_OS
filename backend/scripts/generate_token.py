import secrets
import string

def generate_secure_token():
    """
    Generates a cryptographically secure 256-bit Base62 token.
    Uses the OS's CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
    via Python's `secrets` module, preventing mathematical predictability.
    """
    alphabet = string.ascii_letters + string.digits
    # 256 bits of entropy = 32 bytes.
    # Base62 encoding of 32 random bytes requires ~43 characters.
    # We generate 43 completely unpredictable characters.
    token = ''.join(secrets.choice(alphabet) for _ in range(43))
    
    print("=" * 60)
    print("MISTER OS - SECURE TOKEN GENERATOR")
    print("=" * 60)
    print("Your mathematically uncrackable 256-bit token is:\n")
    print(f"    {token}\n")
    print("Paste this into your .env file as MASTER_TOKEN.")
    print("Keep it safe! If you lose it, you can simply run this script again.")
    print("=" * 60)

if __name__ == "__main__":
    generate_secure_token()
