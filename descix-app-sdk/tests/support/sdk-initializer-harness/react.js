/**
 * A minimal hooks runtime standing in for `react` when tests/sdk-initializer-binding.test.js loads
 * SdkInitializer.jsx (this package has no React or DOM in its test tree). One component instance
 * at a time: hooks are slots by call order, effects run after each render when their deps change.
 * An effect's returned cleanup is kept; unmount() runs them. remount() models React StrictMode's
 * development double-mount: the cleanups run, then the next render runs every effect again with
 * the same state and refs. This proves what a cleanup DOES when called, not that React calls it.
 */
let slots = [];
let cursor = 0;
let pendingEffects = [];

function depsChanged(prev, next) {
  if (!prev || !next) return true;
  return prev.length !== next.length || prev.some((d, i) => !Object.is(d, next[i]));
}

let cleanups = [];

export function resetHooks() {
  slots = [];
  cursor = 0;
  pendingEffects = [];
  cleanups = [];
}

export function unmount() {
  for (const c of cleanups.splice(0)) c();
}

export function remount() {
  unmount();
  for (const slot of slots) if (slot && slot.effect) slot.rerun = true;
}

export function render(Component, props) {
  cursor = 0;
  pendingEffects = [];
  const out = Component(props);
  for (const run of pendingEffects) run();
  return out;
}

export function useRef(initial) {
  const i = cursor++;
  if (!slots[i]) slots[i] = { current: initial };
  return slots[i];
}

export function useState(initial) {
  const i = cursor++;
  if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
  const slot = slots[i];
  return [slot.value, (v) => { slot.value = typeof v === 'function' ? v(slot.value) : v; }];
}

export function useCallback(fn) {
  cursor++;
  return fn;
}

export function useMemo(fn) {
  cursor++;
  return fn();
}

export function useEffect(effect, deps) {
  const i = cursor++;
  const prev = slots[i];
  if (!prev || prev.rerun || depsChanged(prev.deps, deps)) {
    slots[i] = { effect: true, deps };
    pendingEffects.push(() => {
      const cleanup = effect();
      if (typeof cleanup === 'function') cleanups.push(cleanup);
    });
  }
}

export function createElement(type, props, ...children) {
  return { type, props: { ...(props || {}), children: children.length <= 1 ? children[0] : children } };
}

export class Component {}

const React = { useRef, useState, useCallback, useMemo, useEffect, createElement, Component };
export default React;
