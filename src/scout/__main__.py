#!/usr/bin/env python3
"""
Enables running the Scout package as a script:
    python -m scout
    or
    python scout/__main__.py
"""
import os
import sys
import asyncio

# If executed directly, ensure root of src is on sys.path
if __package__ is None:
    pkg_root = os.path.dirname(os.path.dirname(__file__))
    sys.path.insert(0, pkg_root)
    from scout.cli import main
else:
    from .cli import main

if __name__ == "__main__":
    asyncio.run(main())