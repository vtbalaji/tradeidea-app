#!/usr/bin/env -S venv/bin/python3
"""
Load environment variables from .env.local file

Usage:
    from load_env import load_dotenv
    load_dotenv()
"""

import os
from pathlib import Path


def load_dotenv():
    """Load environment variables from .env.local file"""
    env_file = Path(__file__).parent.parent / '.env.local'

    if not env_file.exists():
        print(f"⚠️  .env.local file not found at {env_file}")
        return False

    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()

            # Skip empty lines and comments
            if not line or line.startswith('#'):
                continue

            # Parse KEY=VALUE
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()

                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]

                # Set environment variable (don't override existing)
                if key not in os.environ:
                    os.environ[key] = value

    return True


if __name__ == '__main__':
    if load_dotenv():
        print("✅ Environment variables loaded from .env.local")
    else:
        print("❌ Failed to load environment variables")
