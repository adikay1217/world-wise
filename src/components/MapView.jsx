import { useEffect, useRef, useState } from 'react';
import countries from '../data/countries.js';
import rawMapSvg from '../assets/world-map.svg?raw';
import { WIN_COLOR } from '../lib/color.js';

// The source SVG has leftover inline fill colors baked into a few countries
// (artifacts of the original design mockup's example guesses) — strip them so
// every country starts in the default unguessed color.
const mapSvg = rawMapSvg.replace(/ style="fill:[^"]*"/g, '');

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const DRAG_THRESHOLD = 4;

export default function MapView({ guesses, gameState, targetId, onGuess }) {
  const viewportRef = useRef(null);
  const mapRef = useRef(null);
  const tooltipRef = useRef(null);
  const dragRef = useRef(null);

  // zoom and pan are one state object (not two separate useState calls) so
  // zoomAt can compute both from a single pure updater. Splitting them meant
  // calling setPan(...) *inside* setZoom's updater — a side effect inside an
  // updater function — which React 18 StrictMode intentionally double-invokes
  // in development to catch exactly this, silently applying the pan shift
  // twice per zoom action. That's what made zooming always overshoot toward
  // the bottom-right: the further the cursor was from the top-left origin,
  // the bigger the doubled offset became.
  const [view, setView] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const viewRef = useRef(view);
  viewRef.current = view;
  // Last known cursor position (viewport-relative), used for the hover
  // tooltip.
  const lastMouseRef = useRef(null);

  // Inject the map markup exactly once, imperatively, instead of via
  // dangerouslySetInnerHTML. React re-applies dangerouslySetInnerHTML on
  // every re-render of this component (e.g. the parent re-rendering for an
  // unrelated reason, like a window-resize-triggered scale change) —
  // replacing every country <path> with a brand-new DOM node each time,
  // silently wiping any fill color our repaint effect had set directly on
  // them. Setting innerHTML once on mount, outside React's reconciliation,
  // means later re-renders can never touch or reset this subtree.
  useEffect(() => {
    if (mapRef.current) mapRef.current.innerHTML = mapSvg;
  }, []);

  // Repaint guessed countries whenever guesses/game state change.
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    // Multi-part countries (Canada, Greenland, Australia, ...) are a <g> of
    // several <path> children rather than one <path>. Setting fill on the
    // <g> alone doesn't work: the "fill" CSS rule targets <path> elements
    // directly, and a rule that directly targets an element always wins over
    // an inherited value from a parent, no matter what's set on the parent.
    // So every descendant path needs the color applied too.
    function paint(id, color) {
      const node = el.querySelector('#' + id);
      if (!node) return;
      node.style.fill = color;
      node.querySelectorAll('path').forEach((child) => {
        child.style.fill = color;
      });
    }
    Object.keys(countries).forEach((id) => paint(id, ''));
    guesses.forEach((g) => paint(g.id, g.fillColor));
    if (gameState === 'lost' && targetId) paint(targetId, WIN_COLOR);
  }, [guesses, gameState, targetId]);

  // The whole app is uniformly scaled to fit the screen (see useFitScale in
  // App.jsx), via a CSS transform on an ancestor. getBoundingClientRect()
  // reports the viewport's *rendered* (already-scaled) size, but the map's
  // own pan/zoom transform operates in its *local* CSS pixel space — so a
  // cursor position measured in rendered pixels has to be divided back down
  // by that ancestor scale factor before it means anything to zoomAt.
  function ancestorScale() {
    const vp = viewportRef.current;
    if (!vp || !vp.offsetWidth) return 1;
    return vp.getBoundingClientRect().width / vp.offsetWidth;
  }

  function zoomAt(cx, cy, factor) {
    setView((v) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom * factor));
      const ratio = newZoom / v.zoom;
      const newPan =
        newZoom <= 1
          ? { x: 0, y: 0 }
          : { x: cx - (cx - v.pan.x) * ratio, y: cy - (cy - v.pan.y) * ratio };
      return { zoom: newZoom, pan: newPan };
    });
  }

  function showTooltip(name, x, y) {
    const t = tooltipRef.current;
    if (!t) return;
    t.textContent = name;
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    t.style.display = 'block';
  }
  function hideTooltip() {
    const t = tooltipRef.current;
    if (t) t.style.display = 'none';
  }

  function handleClick(e) {
    if (dragRef.current?.suppressClick) {
      dragRef.current.suppressClick = false;
      return;
    }
    // closest('[id]') can bubble past the map entirely (a click that misses
    // every country shape — a gap, a border seam, open ocean) and land on an
    // unrelated ancestor with an id, e.g. <div id="root">. Only treat it as a
    // guess if it's actually a known country.
    const t = e.target.closest('[id]');
    if (!t || !countries[t.id]) return;
    onGuess(t.id);
  }

  // Drag-to-pan, hover-tooltip, and wheel-zoom are wired up as native listeners
  // (not React's onPointer*/onWheel props) and mutate the DOM only through
  // direct style/text writes on refs — never via React state that would
  // mount/unmount a node. Real bugs were found the hard way here:
  //  1. setPointerCapture() redirects every subsequent pointer/click event's
  //     target to the captured element, breaking country-click hit-testing
  //     and the zoom buttons nested inside the viewport.
  //  2. React registers wheel listeners as passive by default, silently
  //     ignoring preventDefault() — the browser's own page zoom/scroll won.
  //  3. Driving the hover tooltip through React state (conditionally
  //     mounting/unmounting a sibling <div>) corrupts Chromium's mouse-event
  //     (as opposed to pointer-event) hit-testing for the rest of that click
  //     gesture if the DOM mutation lands between pointerdown and pointerup —
  //     mousedown/mouseup silently retarget to the map's wrapper div instead
  //     of the country path, so clicks stop registering. Using a permanently
  //     mounted tooltip node and writing to it imperatively avoids the
  //     mount/unmount entirely.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    function onPointerDown(e) {
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: viewRef.current.pan.x,
        panY: viewRef.current.pan.y,
        moved: false,
        suppressClick: false,
      };
      vp.style.cursor = 'grabbing';
      // No transition while actively dragging — panning needs to track the
      // cursor 1:1, not ease toward it.
      if (mapRef.current) mapRef.current.style.transition = 'none';
    }

    function onPointerMove(e) {
      const rect = vp.getBoundingClientRect();
      lastMouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      const drag = dragRef.current;
      if (drag) {
        // Raw client-pixel deltas have to be scaled back into the map's
        // local pixel space too — same reason as the zoom fix above.
        const s = ancestorScale();
        const dx = (e.clientX - drag.x) / s;
        const dy = (e.clientY - drag.y) / s;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true;
        if (drag.moved) setView((v) => ({ ...v, pan: { x: drag.panX + dx, y: drag.panY + dy } }));
        return;
      }
      const t = e.target.closest && e.target.closest('[id]');
      if (t && countries[t.id]) {
        showTooltip(countries[t.id].name, lastMouseRef.current.x, lastMouseRef.current.y);
      } else {
        hideTooltip();
      }
    }

    function onPointerUp() {
      const drag = dragRef.current;
      if (drag?.moved) drag.suppressClick = true;
      dragRef.current = drag?.moved ? drag : null;
      vp.style.cursor = 'grab';
      if (mapRef.current) mapRef.current.style.transition = '';
    }

    function onPointerLeave() {
      if (!dragRef.current) hideTooltip();
    }

    function onWheel(e) {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const s = ancestorScale();
      // Small per-tick factor so scrolling feels like a gradual zoom rather
      // than jumping in large steps.
      zoomAt(cx / s, cy / s, e.deltaY < 0 ? 1.06 : 1 / 1.06);
    }

    vp.style.cursor = 'grab';
    vp.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointerleave', onPointerLeave);
    // React registers wheel listeners as passive by default, which silently
    // ignores preventDefault(); attaching natively with passive:false is what
    // actually stops the browser's own page-zoom/scroll on wheel/pinch.
    vp.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      vp.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointerleave', onPointerLeave);
      vp.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div ref={viewportRef} className="gc-viewport" onClick={handleClick}>
      <div
        ref={mapRef}
        className="gc-map-inner"
        style={{ transform: `translate(${view.pan.x}px,${view.pan.y}px) scale(${view.zoom})` }}
      />
      <div ref={tooltipRef} className="gc-tooltip" style={{ display: 'none' }} />
      <div className="gc-zoom-controls">
        <button
          onClick={() => {
            const vp = viewportRef.current;
            zoomAt(vp.offsetWidth / 2, vp.offsetHeight / 2, 1.15);
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            const vp = viewportRef.current;
            zoomAt(vp.offsetWidth / 2, vp.offsetHeight / 2, 1 / 1.15);
          }}
        >
          −
        </button>
        <button onClick={() => setView({ zoom: 1, pan: { x: 0, y: 0 } })}>⟲</button>
      </div>
    </div>
  );
}
