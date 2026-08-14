(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = null, mx = 0, my = 0;
  var htimer = null, rtimer = null;

  // DOM references
  var revs = [];
  var scenes = [];
  var zones = [];
  var stage = null;
  var railLinks = [];
  var targets = [];
  var hdr = null;
  var prod = null;
  var hstage = null;
  var rot = null;

  /* ============================================================
     CART STATE
  ============================================================ */
  var cartCount = 0; // running total items in cart

  function getCartDot() { return document.querySelector('.ico .dot'); }

  function setCartCount(n) {
    cartCount = n;
    var dot = getCartDot();
    if (!dot) return;
    dot.textContent = n;
    dot.classList.remove('pop');
    void dot.offsetWidth; // reflow to restart animation
    dot.classList.add('pop');
    var cartBtn = dot.closest('button');
    if (cartBtn) cartBtn.setAttribute('aria-label', 'Cart, ' + n + ' item' + (n !== 1 ? 's' : ''));
  }

  function fetchCartCount() {
    fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
      .then(function(r){ return r.json(); })
      .then(function(d){ setCartCount(d.item_count || 0); })
      .catch(function(){});
  }

  /* ============================================================
     AJAX ADD TO CART
  ============================================================ */
  function ajaxAddToCart(variantId, qty, onSuccess, onError) {
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: qty || 1 })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d && d.status) {
        if (onError) onError(d.description || d.message || 'Error');
        return;
      }
      fetchCartCount();
      if (onSuccess) onSuccess(d);
    })
    .catch(function(e){ if (onError) onError(e && e.message ? e.message : 'Error'); });
  }

  function ajaxUpdateCart(variantId, qty, onDone, onError) {
    // qty 0 means remove
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: qty })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d && d.status) {
        if (onError) onError(d.description || d.message || 'Unable to update cart');
        return;
      }
      fetchCartCount();
      if (onDone) onDone(d);
    })
    .catch(function(e){ if (onError) onError(e && e.message ? e.message : 'Unable to update cart'); });
  }

  function showCardNotice(card, message) {
    if (!card) return;
    var text = message || 'That amount is no longer available.';
    window.alert(text);
  }

  /* ============================================================
     BUNDLE MODE
  ============================================================ */
  var bundleTarget = 0;   // how many products the user wants
  var bundleActive = false;
  var bundleItems = {};   // { variantId: quantity }

  function getBundleTotalCount() {
    var total = 0;
    for (var vid in bundleItems) {
      if (bundleItems.hasOwnProperty(vid)) {
        total += bundleItems[vid];
      }
    }
    return total;
  }

  function syncBundleFromCardDom() {
    var shelf = document.getElementById('shopShelf');
    if (!shelf) return;

    var synced = {};
    shelf.querySelectorAll('.card').forEach(function(card) {
      var row = card.querySelector('.card-qty');
      if (!row) return;

      var vid = row.getAttribute('data-variant') || card.getAttribute('data-variant-id');
      var qty = parseInt(row.getAttribute('data-qty') || '0', 10);
      if (!vid || qty <= 0) return;

      synced[vid] = qty;
    });

    bundleItems = synced;
    updateBpbar();
  }

  // Build / inject the progress bar element once
  function getBpbar() {
    var el = document.getElementById('pl-bpbar');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'pl-bpbar';
    el.className = 'bpbar';
    el.innerHTML =
      '<div class="bpbar-top">' +
        '<div class="bpbar-label">' +
          '<b id="pl-bpbar-title">Bundle: 0 / 0 selected</b>' +
          '<span id="pl-bpbar-sub">Pick products below to build your bundle</span>' +
        '</div>' +
        '<div class="bpbar-actions">' +
          '<button class="bpbar-cancel" id="pl-bpbar-cancel" type="button">Cancel</button>' +
          '<button class="bpbar-checkout" id="pl-bpbar-checkout" type="button">Add bundle to cart</button>' +
        '</div>' +
      '</div>' +
      '<div class="bpbar-track"><div class="bpbar-fill" id="pl-bpbar-fill"></div></div>';
    document.body.appendChild(el);

    document.getElementById('pl-bpbar-cancel').addEventListener('click', cancelBundle);
    document.getElementById('pl-bpbar-checkout').addEventListener('click', checkoutBundle);
    return el;
  }

  function updateBpbar() {
    var selected = getBundleTotalCount();
    var bpbar = getBpbar();
    var title = document.getElementById('pl-bpbar-title');
    var sub = document.getElementById('pl-bpbar-sub');
    var fill = document.getElementById('pl-bpbar-fill');
    var checkout = document.getElementById('pl-bpbar-checkout');

    if (title) title.textContent = 'Bundle: ' + selected + ' / ' + bundleTarget + ' selected';
    var remaining = bundleTarget - selected;
    if (sub) {
      if (remaining > 0) {
        sub.textContent = 'Pick ' + remaining + ' more item' + (remaining > 1 ? 's' : '') + ' to complete your bundle';
      } else {
        sub.textContent = 'Bundle complete! Ready to add to cart.';
      }
    }
    var pct = bundleTarget > 0 ? Math.min(100, Math.max(0, (selected / bundleTarget) * 100)) : 0;
    if (bpbar) {
      bpbar.style.setProperty('--bp-progress', pct + '%');
      bpbar.style.setProperty('--bp-fill-color', '#00706a');
    }
    if (fill) {
      fill.style.width = pct + '%';
      fill.style.minWidth = pct > 0 ? '12px' : '0px';
      fill.style.background = 'linear-gradient(90deg, #6cc2b0 0%, #0d7f73 48%, #005f59 100%)';
      fill.style.opacity = '1';
    }
    if (checkout) checkout.classList.toggle('ready', selected >= bundleTarget);
  }

  function getBundleRemainingForVariant(vid) {
    var currentVal = bundleItems[vid] || 0;
    var totalSelected = getBundleTotalCount();
    var remainingCapacity = bundleTarget > 0 ? bundleTarget - totalSelected : 0;
    return Math.max(0, remainingCapacity + currentVal);
  }

  function syncBundleCardState(card, vid, qty) {
    var row = card ? card.querySelector('.card-qty') : null;
    var btn = card ? card.querySelector('.btn-atc') : null;
    var numEl = row ? row.querySelector('.card-qty-num') : null;

    if (qty > 0) {
      if (card) card.classList.add('in-bundle');
      if (btn) {
        btn.style.display = 'none';
        btn.textContent = 'Add to bundle';
      }
      if (row) {
        row.style.display = 'flex';
        row.setAttribute('data-qty', String(qty));
        row.setAttribute('data-variant', String(vid));
      }
      if (numEl) numEl.textContent = String(qty);
      return;
    }

    if (card) card.classList.remove('in-bundle');
    if (row) {
      row.style.display = 'none';
      row.setAttribute('data-qty', '0');
      row.setAttribute('data-variant', String(vid || ''));
    }
    if (btn) {
      btn.style.display = '';
      btn.textContent = 'Add to bundle';
    }
  }

  function addBundleItem(card, vid) {
    if (!vid || !bundleActive || bundleTarget <= 0) return false;
    var currentVal = bundleItems[vid] || 0;
    var totalSelected = getBundleTotalCount();
    var remaining = bundleTarget - totalSelected;
    if (remaining <= 0) {
      updateBpbar();
      return false;
    }

    bundleItems[vid] = currentVal + 1;
    syncBundleCardState(card, vid, bundleItems[vid]);
    updateBpbar();
    return true;
  }

  function activateBundle(n) {
    bundleTarget = parseInt(n, 10) || 3;
    bundleActive = true;
    bundleItems = {};
    document.body.classList.add('bundle-mode');
    var bpbar = getBpbar();
    
    // reset card elements UI for bundle mode
    var shelf = document.getElementById('shopShelf');
    if (shelf) {
      shelf.querySelectorAll('.card').forEach(function(c){
        c.classList.remove('in-bundle');
        var btn = c.querySelector('.btn-atc');
        var row = c.querySelector('.card-qty');
        if (btn) {
          btn.style.display = '';
          btn.textContent = 'Add to bundle';
          btn.disabled = false;
        }
        if (row) {
          row.style.display = 'none';
          row.setAttribute('data-qty', '0');
        }
      });
    }

    updateBpbar();
    syncBundleFromCardDom();
    setTimeout(function(){ bpbar.classList.add('show'); }, 20);

    var shopSec = document.getElementById('shop');
    if (shopSec) {
      shopSec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function cancelBundle() {
    bundleActive = false;
    bundleItems = {};
    document.body.classList.remove('bundle-mode');
    var bpbar = document.getElementById('pl-bpbar');
    if (bpbar) bpbar.classList.remove('show');
    
    // restore cards UI to normal mode
    var shelf = document.getElementById('shopShelf');
    if (shelf) {
      shelf.querySelectorAll('.card').forEach(function(c){
        c.classList.remove('in-bundle');
        var btn = c.querySelector('.btn-atc');
        var row = c.querySelector('.card-qty');
        if (btn) {
          btn.style.display = '';
          btn.textContent = 'Add to cart';
          btn.disabled = false;
        }
        if (row) {
          row.style.display = 'none';
          row.setAttribute('data-qty', '0');
        }
      });
    }
  }

  function checkoutBundle() {
    if (getBundleTotalCount() < bundleTarget) return;
    var itemsArr = [];
    for (var vid in bundleItems) {
      if (bundleItems.hasOwnProperty(vid)) {
        itemsArr.push({
          id: parseInt(vid, 10),
          quantity: bundleItems[vid]
        });
      }
    }
    if (itemsArr.length === 0) return;

    var checkoutBtn = document.getElementById('pl-bpbar-checkout');
    if (checkoutBtn) {
      checkoutBtn.textContent = 'Adding to cart…';
      checkoutBtn.style.pointerEvents = 'none';
    }

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: itemsArr })
    })
    .then(function(r){ return r.json(); })
    .then(function(){
      fetchCartCount();
      cancelBundle();
      window.location.href = '/cart';
    })
    .catch(function(){
      cancelBundle();
      window.location.href = '/cart';
    });
  }

  /* ============================================================
     INIT — wires up all interactivity
  ============================================================ */
  function init() {
    if (htimer) { clearInterval(htimer); htimer = null; }
    if (rtimer) { clearInterval(rtimer); rtimer = null; }

    revs = document.querySelectorAll('.rv');
    scenes = [].slice.call(document.querySelectorAll('.scene'));
    zones = [].slice.call(document.querySelectorAll('[data-scene]'));
    stage = document.getElementById('scenes');
    railLinks = [].slice.call(document.querySelectorAll('.rail a'));
    targets = railLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    hdr = document.getElementById('hdr');
    prod = document.getElementById('heroProd');
    hstage = document.getElementById('hstage');
    rot = document.getElementById('rot');

    /* ---------- reveal on scroll ---------- */
    if ('IntersectionObserver' in window && !reduce) {
      var ro = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.01 });
      revs.forEach(function (el) { ro.observe(el); });
    } else {
      revs.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------- horizontal combo rail controls ---------- */
    document.querySelectorAll('.comborail').forEach(function (rail) {
      var shell = rail.closest('.combo-rail');
      if (!shell) return;
      var prev = shell.querySelector('.combo-prev');
      var next = shell.querySelector('.combo-next');
      var step = Math.max(rail.clientWidth * 0.82, 260);

      function moveCombo(direction) {
        rail.scrollBy({
          left: direction * step,
          behavior: reduce ? 'auto' : 'smooth'
        });
      }

      if (prev) prev.addEventListener('click', function () { moveCombo(-1); });
      if (next) next.addEventListener('click', function () { moveCombo(1); });

      rail.addEventListener('wheel', function (event) {
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          event.preventDefault();
          rail.scrollLeft += event.deltaY;
        }
      }, { passive: false });

      rail.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          moveCombo(1);
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          moveCombo(-1);
        }
      });
    });

    /* ---------- hero stage: 1 -> 2 -> 3 products ---------- */
    if (hstage) {
      var hs = [].slice.call(hstage.querySelectorAll('.hslide'));
      var hd = [].slice.call(document.querySelectorAll('#hdots button'));
      var hi = 0;
      function hgo(n) {
        hi = (n + hs.length) % hs.length;
        hs.forEach(function (s, i) { s.classList.toggle('on', i === hi); });
        hd.forEach(function (d, i) { d.classList.toggle('on', i === hi); });
      }
      function hplay() { if (!htimer && !reduce) htimer = setInterval(function () { hgo(hi + 1); }, 3800); }
      function hstop() { if (htimer) { clearInterval(htimer); htimer = null; } }
      hd.forEach(function (d, i) {
        d.addEventListener('click', function () { hstop(); hgo(i); hplay(); });
      });
      hstage.addEventListener('mouseenter', hstop);
      hstage.addEventListener('mouseleave', hplay);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? hplay() : hstop(); });
        }, { threshold: 0.2 }).observe(hstage);
      } else { hplay(); }
    }

    /* ---------- product rotator ---------- */
    if (rot) {
      var rimgs = [].slice.call(rot.querySelectorAll('.frame .pimg'));
      var rdots = [].slice.call(rot.querySelectorAll('.dots i'));
      var rcapB = rot.querySelector('.cap b');
      var rcapS = rot.querySelector('.cap span');
      var ri = 0;
      function rstep() {
        rimgs[ri].classList.remove('on');
        if (rdots[ri]) rdots[ri].classList.remove('on');
        ri = (ri + 1) % rimgs.length;
        rimgs[ri].classList.add('on');
        if (rdots[ri]) rdots[ri].classList.add('on');
        if (rcapB) rcapB.innerHTML = rimgs[ri].getAttribute('data-name');
        if (rcapS) rcapS.textContent = rimgs[ri].getAttribute('data-note');
      }
      if (!reduce) {
        var rio = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting && !rtimer) rtimer = setInterval(rstep, 2900);
            else if (!e.isIntersecting && rtimer) { clearInterval(rtimer); rtimer = null; }
          });
        }, { threshold: 0.25 });
        rio.observe(rot);
      }
    }

    /* ---------- ambient drift on the hero product ---------- */
    if (!reduce && prod) {
      prod.animate(
        [{ filter: 'drop-shadow(0 34px 54px rgba(2,20,19,.6))' },
         { filter: 'drop-shadow(0 42px 68px rgba(2,20,19,.68))' },
         { filter: 'drop-shadow(0 34px 54px rgba(2,20,19,.6))' }],
        { duration: 7000, iterations: Infinity, easing: 'ease-in-out' }
      );
    }

    /* ---------- "Build this box" buttons ---------- */
    document.querySelectorAll('[data-build-box]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        activateBundle(btn.getAttribute('data-build-box'));
      });
    });

    /* ---------- Shop product cards: Add to cart / qty stepper ---------- */
    var shelf = document.getElementById('shopShelf');
    if (shelf) {
      shelf.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn-atc');
        var qbtn = e.target.closest('.card-qty-btn');

        if (btn && !btn.disabled) {
          var card = btn.closest('.card');
          if (!card) return;
          var available = card.getAttribute('data-available');
          if (available === 'false') return;

          if (bundleActive) {
            // Bundle mode: add exactly 1 item per click and cap at the target total.
            var vid = card.getAttribute('data-variant-id');
            if (!vid) return;
            addBundleItem(card, vid);
          } else {
            // Normal mode: AJAX add to cart
            var vid = card.getAttribute('data-variant-id');
            if (!vid) return;
            btn.disabled = true;
            btn.textContent = 'Adding…';
            ajaxAddToCart(parseInt(vid, 10), 1, function() {
              btn.disabled = false;
              // Show qty stepper
              var row = card.querySelector('.card-qty');
              if (row) {
                btn.style.display = 'none';
                row.style.display = 'flex';
                var numEl = row.querySelector('.card-qty-num');
                if (numEl) numEl.textContent = '1';
                row.setAttribute('data-qty', '1');
                row.setAttribute('data-variant', vid);
              } else {
                btn.textContent = '✓ Added';
                setTimeout(function(){ btn.textContent = 'Add to cart'; }, 1800);
              }
            }, function() {
              btn.disabled = false;
              btn.textContent = 'Add to cart';
            });
          }
        }

        if (qbtn) {
          var row = qbtn.closest('.card-qty');
          if (!row) return;
          var vid = row.getAttribute('data-variant');
          var card = row.closest('.card');
          var action = qbtn.getAttribute('data-action');

          if (bundleActive) {
            var currentVal = bundleItems[vid] || 0;
            if (action === 'inc') {
              if (bundleTarget > 0 && getBundleTotalCount() >= bundleTarget) {
                updateBpbar();
                return;
              }
              bundleItems[vid] = currentVal + 1;
            } else if (action === 'dec') {
              bundleItems[vid] = currentVal - 1;
            }

            var newVal = bundleItems[vid] || 0;
            if (newVal <= 0) {
              delete bundleItems[vid];
              syncBundleCardState(card, vid, 0);
            } else {
              syncBundleCardState(card, vid, newVal);
            }
            syncBundleFromCardDom();
            updateBpbar();
          } else {
            // Normal cart mode
            var currentQty = parseInt(row.getAttribute('data-qty') || '1', 10);
            var nextQty = action === 'inc' ? currentQty + 1 : currentQty - 1;
            var numEl = row.querySelector('.card-qty-num');

            function revertCardQtyState() {
              row.setAttribute('data-qty', String(currentQty));
              if (numEl) numEl.textContent = String(currentQty);
            }

            if (nextQty <= 0) {
              ajaxUpdateCart(
                vid,
                0,
                function() {
                  row.style.display = 'none';
                  var atcBtn = card ? card.querySelector('.btn-atc') : null;
                  if (atcBtn) { atcBtn.style.display = ''; atcBtn.textContent = 'Add to cart'; }
                },
                function() {
                  revertCardQtyState();
                }
              );
            } else {
              row.setAttribute('data-qty', String(nextQty));
              if (numEl) numEl.textContent = String(nextQty);

              ajaxUpdateCart(
                vid,
                nextQty,
                function() {
                  row.setAttribute('data-qty', String(nextQty));
                  if (numEl) numEl.textContent = String(nextQty);
                },
                function(message) {
                  revertCardQtyState();
                  showCardNotice(card, message || 'That amount is no longer available.');
                }
              );
            }
          }
        }
      });
    }

    // Fetch live cart count on load
    fetchCartCount();

    frame();
  }

  var current = 0;
  function setScene(n) {
    if (n === current) return;
    current = n;
    scenes.forEach(function (s, i) { s.classList.toggle('on', i + 1 === n); });
    if (stage) stage.setAttribute('data-d', String(n));
  }
  function pickScene() {
    var focus = window.scrollY + window.innerHeight * 0.5, n = 1;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i], top = 0, el = z;
      while (el) { top += el.offsetTop; el = el.offsetParent; }
      if (top <= focus) n = parseInt(z.getAttribute('data-scene'), 10) || n;
    }
    setScene(n);
  }

  function syncRail() {
    var mid = window.scrollY + window.innerHeight * 0.42, idx = 0;
    targets.forEach(function (t, i) { if (t && t.offsetTop <= mid) idx = i; });
    railLinks.forEach(function (a, i) { a.classList.toggle('on', i === idx); });
  }

  function frame() {
    raf = null;
    var y = window.scrollY || window.pageYOffset;
    if (hdr) hdr.classList.toggle('up', y > 90);
    if (!reduce) {
      var wl = document.querySelectorAll('#water .wl');
      for (var i = 0; i < wl.length; i++) {
        var d = [0.05, 0.09, 0.03, 0.02][i] || 0.05;
        wl[i].style.setProperty('--px', (mx * d * 130).toFixed(1) + 'px');
        wl[i].style.setProperty('--py', (-y * d + my * d * 90).toFixed(1) + 'px');
      }
      if (prod) {
        var f = Math.min(y / 700, 1);
        prod.style.transform = 'translate3d(' + (mx * -16).toFixed(2) + 'px,' + (-f * 54 + my * -10).toFixed(2) + 'px,0) scale(' + (1 - f * 0.06).toFixed(3) + ')';
        prod.style.opacity = (1 - f * 0.55).toFixed(3);
      }
    }
    syncRail();
    pickScene();
  }

  function onScroll() { if (!raf) raf = requestAnimationFrame(frame); }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  if (!reduce && window.matchMedia('(min-width: 1024px)').matches) {
    window.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      onScroll();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();

