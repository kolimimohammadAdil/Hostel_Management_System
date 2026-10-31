#!/usr/bin/env python3
"""
ALTS Hostel Portal — Facial Biometric Recognition Engine Entry Point
Delegates execution to face_service/service.py
"""
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import service

if __name__ == "__main__":
    service.run()
