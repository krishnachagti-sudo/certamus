/* Certamus motion.
 *
 * The rule here is that motion should carry the argument, not decorate it. So:
 *
 *   - the bars in a chart grow in order, because the chart IS a comparison and
 *     watching it build is how the gap lands. The nine-point size gap reads as
 *     a result rather than a fact you were handed.
 *   - a table row brings its RESULT in last, a beat after the rest, because the
 *     result is what the row is for.
 *   - the rules that structure the page draw rather than appear, because this
 *     design is built out of hairlines; animating them is the design moving
 *     rather than something laid on top of it.
 *   - the full stop in "We compete." resolves into the Conyso gold dot, which
 *     is the parent wordmark's own device.
 *
 * SAFETY, in the order it matters:
 *   1. Every hidden-at-rest state is scoped to html.ce-js, and this file adds
 *      that class. No JavaScript, no hiding: the page renders complete.
 *   2. prefers-reduced-motion is honoured by adding ce-js but marking the
 *      document reduced, which shows everything at once with no transitions.
 *   3. Every observer fires once and disconnects.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("ce-js");
  if (reduce) { root.classList.add("ce-reduce"); }

  // -- 4b. the slide rails --------------------------------------------------
  // Buttons, a progress bar, and a marker on whichever slide is currently
  // snapped. The rail already works without any of this: it is a scroll
  // container, so a trackpad, a wheel, a touch drag and the arrow keys all
  // move it. What follows makes that state visible and gives a mouse user
  // something to click.
  //
  // The buttons are rendered by the server rather than created here, so they
  // are in the tab order and the markup is the same either way. If this
  // function never runs they still submit nothing and do nothing visible,
  // which is why they are hidden below until wired.
  var rails = document.querySelectorAll(".ce-rail");
  Array.prototype.forEach.call(rails, function (rail) {
    var track = rail.querySelector(".ce-rail-track");
    var cells = rail.querySelectorAll(".ce-rail-cell");
    if (!track || cells.length < 2) { return; }

    var bar = rail.querySelector(".ce-rail-bar > span");
    var btns = rail.querySelectorAll(".ce-rail-b");
    rail.classList.add("is-wired");

    function step() {
      // Measured rather than assumed: the gap is a clamp() and changes with
      // the viewport, so reading two cells apart is the only honest width.
      if (cells.length < 2) { return cells[0].offsetWidth; }
      return cells[1].offsetLeft - cells[0].offsetLeft;
    }

    function current() {
      var x = track.scrollLeft, best = 0, bestD = Infinity;
      for (var i = 0; i < cells.length; i++) {
        var d = Math.abs(cells[i].offsetLeft - track.offsetLeft - x);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    }

    var raf = false;
    function paint() {
      raf = false;
      var max = track.scrollWidth - track.clientWidth;
      var frac = max > 0 ? track.scrollLeft / max : 0;
      var i = current();
      if (bar) {
        // The bar shows how much of the rail is on screen, positioned by how
        // far along you are: a scrollbar, not a step counter.
        var visible = Math.min(1, track.clientWidth / track.scrollWidth);
        bar.style.width = (visible * 100).toFixed(2) + "%";
        bar.style.transform = "translateX(" + (frac * (100 / visible - 100)).toFixed(2) + "%)";
      }
      for (var c = 0; c < cells.length; c++) {
        cells[c].classList.toggle("is-here", c === i);
      }
      for (var b = 0; b < btns.length; b++) {
        var dir = parseInt(btns[b].getAttribute("data-d"), 10);
        btns[b].disabled = dir < 0 ? track.scrollLeft <= 2
                                   : track.scrollLeft >= max - 2;
      }
    }

    track.addEventListener("scroll", function () {
      if (!raf) { raf = true; window.requestAnimationFrame(paint); }
    }, { passive: true });

    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        var dir = parseInt(b.getAttribute("data-d"), 10);
        track.scrollBy({ left: dir * step(),
                         behavior: reduce ? "auto" : "smooth" });
      });
    });

    window.addEventListener("resize", paint, { passive: true });
    paint();
  });


  // -- 4c. the contents rail follows the reader --------------------------
  // .ce-toc a.is-here was styled and never set: the only is-here in this file
  // was the rail cell marker, so the highlight was dead CSS on every guide.
  //
  // Driven by scroll position rather than IntersectionObserver. Not because IO
  // is wrong for this, but because it could not be verified: an observer
  // created inside a headless iframe fired zero callbacks, so any IO version
  // of this would have shipped untested. A line at 28% of the viewport and a
  // rect comparison is deterministic and can be checked by setting scrollTop.
  //
  // Wired above the motion gate because knowing where you are in a long page
  // is orientation, not decoration, and a reader who asked for no motion still
  // wants it.
  var toc = document.querySelector(".ce-toc");
  if (toc) {
    var tocLinks = {};
    Array.prototype.forEach.call(toc.querySelectorAll("a[href^='#']"), function (a) {
      tocLinks[a.getAttribute("href").slice(1)] = a;
    });
    var tocHeads = [].slice.call(
      document.querySelectorAll(".ce-guide-main .ce-section[id]"));
    var tocMarked = null;

    function tocSpy() {
      tocTick = false;
      if (!tocHeads.length) { return; }
      var line = window.innerHeight * 0.28;
      var id = tocHeads[0].id;
      for (var i = 0; i < tocHeads.length; i++) {
        // the last section whose top has passed the line; scrolled to the very
        // bottom the final section wins even if it is short
        if (tocHeads[i].getBoundingClientRect().top <= line) { id = tocHeads[i].id; }
      }
      if (id === tocMarked || !tocLinks[id]) { return; }
      if (tocMarked && tocLinks[tocMarked]) {
        tocLinks[tocMarked].classList.remove("is-here");
      }
      tocLinks[id].classList.add("is-here");
      tocMarked = id;
    }

    var tocTick = false;
    window.addEventListener("scroll", function () {
      if (!tocTick) { tocTick = true; window.requestAnimationFrame(tocSpy); }
    }, { passive: true });
    window.addEventListener("resize", tocSpy, { passive: true });
    tocSpy();
  }

  // Everything past this point is motion, and a reader who asked for no
  // motion gets none of it. The rails are wired ABOVE this line on purpose:
  // buttons and a progress bar are function, not decoration, and returning
  // early used to leave them rendered, focusable and dead for exactly the
  // readers least able to drag a scroll container sideways.
  if (reduce) { return; }

  // Everything waiting on an observer, so sweep() can force it in.
  var pending = [];

  function onceVisible(el, fn, margin) {
    if (!("IntersectionObserver" in window)) { fn(); return; }

    // Capture the original before wrapping. Assigning the wrapper back over the
    // same name makes the wrapper call itself, which is an infinite recursion
    // that kills the script and leaves the whole page at opacity 0.
    var rec = { el: el, done: false };
    rec.fire = function () {
      if (rec.done) { return; }
      rec.done = true;
      fn();
    };
    pending.push(rec);

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.disconnect(); rec.fire(); return; }
      }
    }, { rootMargin: margin || "0px 0px -5% 0px", threshold: 0.01 });
    // -5%, not -12%: a heading sitting right at the viewport edge was staying
    // invisible long enough to read as a gap rather than a reveal.
    io.observe(el);
  }

  // -- 0. the safety net ----------------------------------------------------
  // An IntersectionObserver only reports what intersects. Jump straight to the
  // bottom of the page -- an anchor link, a restored scroll position, a fast
  // flick -- and every section in between is never observed, so its content
  // stays at opacity 0 permanently. Measured: 15 elements stranded after one
  // programmatic jump.
  //
  // So anything already scrolled past is revealed immediately, without the
  // transition it missed.
  var ticking = false;
  function sweep() {
    ticking = false;
    for (var i = 0; i < pending.length; i++) {
      var rec = pending[i];
      if (rec.done) { continue; }
      var r = rec.el.getBoundingClientRect();
      if (r.top < window.innerHeight) { rec.fire(); }
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(sweep); }
  }, { passive: true });
  // and once after load, for a page opened already scrolled
  window.addEventListener("load", function () { setTimeout(sweep, 60); });

  // -- 1. the hero dot ------------------------------------------------------
  // Lands a beat after the line has been read, not on arrival.
  var dot = document.querySelector(".ce-dot");
  if (dot) { setTimeout(function () { dot.classList.add("is-in"); }, 520); }

  // -- 2. rules draw --------------------------------------------------------
  var sections = document.querySelectorAll(".ce-section");
  Array.prototype.forEach.call(sections, function (s) {
    onceVisible(s, function () { s.classList.add("is-in"); });
  });

  // -- 3. record rows, result last -----------------------------------------
  var table = document.querySelector(".ce-record");
  if (table) {
    var rows = table.querySelectorAll("tbody tr");
    onceVisible(table, function () {
      Array.prototype.forEach.call(rows, function (r, i) {
        setTimeout(function () { r.classList.add("is-in"); }, i * 90);
      });
    });
  }

  // -- 4. chart bars grow, in order ----------------------------------------
  // The bar is scaled from its own left edge. transform-box: fill-box keeps the
  // origin on the rect rather than the whole SVG, which is the bit that is easy
  // to get wrong and produces bars that slide in from the left instead.
  var figs = document.querySelectorAll(".ce-fig svg");
  Array.prototype.forEach.call(figs, function (svg) {
    var bars = svg.querySelectorAll("rect");
    onceVisible(svg, function () {
      Array.prototype.forEach.call(bars, function (b, i) {
        setTimeout(function () { b.classList.add("is-in"); }, 90 + i * 70);
      });
      var labels = svg.querySelectorAll("text");
      Array.prototype.forEach.call(labels, function (t, i) {
        setTimeout(function () { t.classList.add("is-in"); }, 120 + i * 35);
      });
    });
  });

  // -- 5. slides and portraits ---------------------------------------------
  // .ce-rail reveals as ONE object. Its cells are excluded on purpose: a cell
  // scrolled off to the right of the viewport never intersects, so it would
  // stay at opacity 0 and then flash in when someone scrolled the rail.
  var reveal = document.querySelectorAll(
    ".ce-slide, .ce-person, .ce-method, .ce-mycase, .ce-rail, .ce-dia");
  Array.prototype.forEach.call(reveal, function (el, i) {
    onceVisible(el, function () {
      setTimeout(function () { el.classList.add("is-in"); }, (i % 6) * 60);
    });
  });
})();
