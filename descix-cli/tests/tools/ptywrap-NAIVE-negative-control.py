#!/usr/bin/env python3
"""NEGATIVE CONTROL ONLY -- the naive wrapper the rehomed ptywrap's TRAP section warns about.
Uses sys.stdin.buffer.read() in a daemon thread and falls off the end of main. NOT FOR USE."""
import pty, sys, subprocess, threading, os

master, slave = pty.openpty()
child = subprocess.Popen(sys.argv[1:], stdin=slave, close_fds=False)
os.close(slave)

def pump():
    while True:
        b = sys.stdin.buffer.read(1024)   # buffered-IO lock -- the trap
        if not b:
            break
        os.write(master, b)

threading.Thread(target=pump, daemon=True).start()
rc = child.wait()
sys.exit(rc)                              # interpreter shutdown -- the trap fires here
