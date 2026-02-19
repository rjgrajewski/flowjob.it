"""
CLI entry point for Atlas module.
Allows running: python -m atlas.extract_skills
"""

import argparse
import asyncio


from .normalize_skills import main as normalize_main

def main():
    parser = argparse.ArgumentParser(description="Atlas CLI")
    subparsers = parser.add_subparsers(dest="command")
    
    
    # Normalize
    norm_parser = subparsers.add_parser("normalize", help="Run skill normalization")
    norm_parser.add_argument("--stage", type=str, default="all", choices=["all", "extract", "normalize", "deduplicate", "link"], help="Stage to run.")
    
    args = parser.parse_args()
    
    if args.command == "normalize":
        asyncio.run(normalize_main(stage=args.stage))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

