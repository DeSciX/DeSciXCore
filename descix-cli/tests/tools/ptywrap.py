#!/usr/bin/env python3
"""Run argv[1:] with a PTY as its stdin, so the child sees `process.stdin.isTTY === true`.

WHY THIS EXISTS. Several gates in this suite assert behaviour that only occurs on an
INTERACTIVE stdin. A piped stdin is not a TTY, so a harness that pipes cannot reach the
prompting path at all, and a gate written against it measures the refusal instead of the
behaviour. This wrapper is the only supported way for a harness in this repo to give the CLI a
real terminal. Do not hand-roll a second one -- see the trap below for what that costs.

CONTRACT. stdout/stderr are INHERITED, so the caller's own pipes capture the child's real output
unchanged. Bytes arriving on OUR stdin are forwarded into the pty master. The process exits with
the CHILD'S OWN status, so `child.status`/`code` upstream means what it says.

  spawn('python3', [PTYWRAP, process.execPath, BIN_JS, 'quickstart'], { stdio:['pipe','pipe','pipe'] })

=====================================================================================
TRAP -- READ THIS BEFORE YOU "SIMPLIFY" THE I/O BELOW. MEASURED 2026-09-15.
=====================================================================================
The obvious implementation -- a daemon thread calling `sys.stdin.buffer.read()` -- makes CPython
abort with SIGABRT (_enter_buffered_busy) at INTERPRETER SHUTDOWN, because the daemon thread is
still holding the buffered-IO lock when the interpreter tears down.

That abort happens AFTER `child.wait()` has already returned. The consequences are nasty and
specifically hard to attribute:

  * The caller reads the WRAPPER's exit status, not the child's -- it comes back as `null`
    (SIGABRT), so a gate asserting `code !== 0` or `code === 0` fails on `null`.
  * Every SUBSTANTIVE assertion in that gate passes. Only the exit code is wrong.
  * Nothing upstream is corrupted, so the failure reads as a defect in the SUBJECT rather than
    in the instrument. A verifier lost real time to exactly this before isolating it here.

THE TWO THINGS THAT AVOID IT, both load-bearing:
  1. RAW FD I/O: `os.read(0, 1024)` instead of `sys.stdin.buffer.read()` -- no buffered-IO lock.
  2. `os._exit(rc)` instead of falling off the end of main -- skips interpreter shutdown entirely,
     so there is no teardown for a daemon thread to abort during.

A harness that propagates the child's exit code is the control that makes this trap VISIBLE.
Keep asserting on exit codes; dropping that assertion is what let the trap hide in the first place.
=====================================================================================
"""
import os, pty, sys, subprocess, threading, time

master, slave = pty.openpty()
child = subprocess.Popen(sys.argv[1:], stdin=slave, close_fds=False)
os.close(slave)


def pump():
    """Forward the caller's stdin into the pty master. RAW fd reads only -- see TRAP above."""
    while True:
        try:
            b = os.read(0, 1024)
        except OSError:
            break
        if not b:
            break          # caller closed stdin; the PTY stays open, like a real terminal
        try:
            os.write(master, b)
        except OSError:
            break


def hardstop():
    """Backstop so a hung child cannot outlive the harness's own timeout."""
    time.sleep(75)
    if child.poll() is None:
        child.kill()


threading.Thread(target=pump, daemon=True).start()
threading.Thread(target=hardstop, daemon=True).start()

rc = child.wait()
# os._exit, NOT sys.exit -- see TRAP above. Negative rc means killed by signal N.
os._exit(rc if rc >= 0 else 128 - rc)
