/* =========================================================
   T&C RENTAL — 렌탈 창업 리뉴얼 사이트
   Shared Vanilla JS (no frameworks, no build tools)
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Mobile hamburger nav ---------- */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a nav link is clicked (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- Count-up number animation (stat cards) ---------- */
  function initCounters() {
    var counters = document.querySelectorAll('.stat-card strong');
    if (!counters.length) return;

    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    counters.forEach(function (el) {
      var textNode = null;
      for (var i = 0; i < el.childNodes.length; i++) {
        var node = el.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          textNode = node;
          break;
        }
      }
      if (!textNode) return;

      var target = parseInt(textNode.textContent.replace(/[^0-9]/g, ''), 10);
      if (isNaN(target)) return;

      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        textNode.textContent = target.toLocaleString('ko-KR');
        return;
      }

      var duration = 1400;
      var rafId = null;

      function setValue(value) {
        textNode.textContent = value.toLocaleString('ko-KR');
      }

      function animate() {
        if (rafId) cancelAnimationFrame(rafId);
        var startTime = null;
        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          var progress = Math.min((timestamp - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(target * eased));
          if (progress < 1) {
            rafId = requestAnimationFrame(step);
          } else {
            rafId = null;
          }
        }
        rafId = requestAnimationFrame(step);
      }

      function reset() {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        setValue(0);
      }

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animate();
            } else {
              reset();
            }
          });
        },
        { threshold: 0.4 }
      );

      reset();
      observer.observe(el);
    });
  }

  /* ---------- Market growth chart (스크롤 진입 시 성장 애니메이션 재생) ---------- */
  function initMarketChart() {
    var chart = document.querySelector('.market-chart');
    if (!chart) return;

    if (!('IntersectionObserver' in window)) {
      chart.classList.add('is-visible');
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            void chart.offsetWidth;
            chart.classList.add('is-visible');
          } else {
            chart.classList.remove('is-visible');
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(chart);
  }

  /* ---------- Current year in footer ---------- */
  function initYear() {
    var yearEls = document.querySelectorAll('[data-current-year]');
    var year = new Date().getFullYear();
    yearEls.forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ---------- Contact form validation + Formspree submit ---------- */
  function initContactForm() {
    var form = document.getElementById('consult-form');
    if (!form) return;

    var statusBox = document.getElementById('form-status');

    function setFieldError(field, message) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.add('field--error');
      var msg = wrap.querySelector('.field__error-msg');
      if (msg) msg.textContent = message;
      field.setAttribute('aria-invalid', 'true');
    }

    function clearFieldError(field) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.remove('field--error');
      field.removeAttribute('aria-invalid');
    }

    function validateField(field) {
      if (!field.hasAttribute('required')) return true;
      var value = (field.value || '').trim();

      if (!value) {
        setFieldError(field, '필수 입력 항목입니다.');
        return false;
      }

      if (field.type === 'tel') {
        var telPattern = /^[0-9-+\s]{9,14}$/;
        if (!telPattern.test(value)) {
          setFieldError(field, '올바른 연락처 형식으로 입력해주세요. (예: 010-1234-5678)');
          return false;
        }
      }

      clearFieldError(field);
      return true;
    }

    // Validate on blur for real-time feedback
    form.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (field) {
      field.addEventListener('blur', function () {
        validateField(field);
      });
      field.addEventListener('input', function () {
        if (field.closest('.field').classList.contains('field--error')) {
          validateField(field);
        }
      });
    });

    // 단독몰 선택 시에만 브랜드 선택 필드를 노출 + 필수화
    var interestSelect = document.getElementById('interest');
    var brandField = document.getElementById('brand-field');
    var brandSelect = document.getElementById('brand');

    function syncBrandField() {
      if (!interestSelect || !brandField || !brandSelect) return;
      var showBrand = interestSelect.value === '단독몰';
      brandField.hidden = !showBrand;
      if (showBrand) {
        brandSelect.setAttribute('required', 'required');
      } else {
        brandSelect.removeAttribute('required');
        brandSelect.value = '';
        clearFieldError(brandSelect);
      }
    }

    if (interestSelect) {
      interestSelect.addEventListener('change', syncBrandField);
      syncBrandField();
    }

    if (brandSelect) {
      brandSelect.addEventListener('blur', function () {
        validateField(brandSelect);
      });
      brandSelect.addEventListener('change', function () {
        if (brandSelect.closest('.field').classList.contains('field--error')) {
          validateField(brandSelect);
        }
      });
    }

    form.addEventListener('submit', function (e) {
      var requiredFields = Array.prototype.slice.call(
        form.querySelectorAll('input[required], select[required], textarea[required]')
      );
      var isValid = requiredFields.reduce(function (valid, field) {
        var fieldValid = validateField(field);
        return valid && fieldValid;
      }, true);

      if (!isValid) {
        e.preventDefault();
        if (statusBox) {
          statusBox.textContent = '입력 내용을 다시 확인해주세요. 필수 항목을 모두 채워주세요.';
          statusBox.setAttribute('data-state', 'error');
        }
        var firstError = form.querySelector('.field--error input, .field--error select, .field--error textarea');
        if (firstError) firstError.focus();
        return;
      }

      var action = form.getAttribute('action') || '';
      if (action.indexOf('REPLACE_WITH_FORMSPREE_ID') !== -1) {
        // Formspree not yet configured — prevent a failed submit and guide the user.
        e.preventDefault();
        if (statusBox) {
          statusBox.textContent =
            '아직 Formspree 설정이 완료되지 않았습니다. 안내된 방법으로 Form ID를 등록하거나, 하단의 "이메일로 바로 문의하기" 링크를 이용해주세요.';
          statusBox.setAttribute('data-state', 'error');
        }
        return;
      }

      // Valid + configured: let the browser submit to Formspree normally.
      if (statusBox) {
        statusBox.textContent = '상담 신청을 전송하고 있습니다...';
        statusBox.setAttribute('data-state', 'success');
      }
    });
  }

  /* ---------- Kakao Map (회사 위치) ---------- */
  function initKakaoMap() {
    var mapEl = document.getElementById('kakao-map');
    var fallbackEl = document.getElementById('map-fallback');
    if (!mapEl || !fallbackEl) return;

    // appkey 미설정/무효 시 window.kakao가 없거나 maps가 없을 수 있음 — 이 경우 fallback(자리표시자)이 그대로 보임.
    if (typeof kakao === 'undefined' || !kakao.maps) return;

    var COMPANY_ADDRESS = '서울특별시 송파구 법원로 127';
    var COMPANY_NAME_HTML = '<div style="padding:8px 10px;font-size:13px;line-height:1.5;white-space:nowrap;">(주)티앤씨노블<br>문정대명벨리온 713,714호</div>';
    // Nominatim 지오코딩으로 확인한 대략 좌표(문정대명벨리온) — 카카오 지오코더 실패 시 대체 중심점으로 사용.
    var FALLBACK_LAT = 37.4862547;
    var FALLBACK_LNG = 127.1188088;

    try {
      kakao.maps.load(function () {
        var center = new kakao.maps.LatLng(FALLBACK_LAT, FALLBACK_LNG);
        var map = new kakao.maps.Map(mapEl, { center: center, level: 3 });

        function showMap(position) {
          var marker = new kakao.maps.Marker({ position: position, map: map });
          var infoWindow = new kakao.maps.InfoWindow({ content: COMPANY_NAME_HTML });
          infoWindow.open(map, marker);
          fallbackEl.hidden = true;
          mapEl.hidden = false;
        }

        if (kakao.maps.services && kakao.maps.services.Geocoder) {
          var geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(COMPANY_ADDRESS, function (result, status) {
            if (status === kakao.maps.services.Status.OK && result && result[0]) {
              var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
              map.setCenter(coords);
              showMap(coords);
            } else {
              showMap(center);
            }
          });
        } else {
          showMap(center);
        }
      });
    } catch (err) {
      // appkey가 유효하지 않은 경우 등 — fallback을 그대로 둔다.
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initCounters();
    initMarketChart();
    initYear();
    initContactForm();
    initKakaoMap();
  });
})();
