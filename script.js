/* =========================================================
   T&C RENTAL — 렌탈 창업 리뉴얼 사이트
   Shared Vanilla JS (no frameworks, no build tools)
   ========================================================= */
(function () {
  'use strict';

  var heroVantaInstance = null;
  var topologyInstances = [];

  /* 테마에 맞춰 이미 생성된 VANTA(WebGL/캔버스) 배경들의 색상을 즉시 갱신 */
  function applyVantaTheme() {
    // VANTA.DOTS/TOPOLOGY는 setOptions만으로 color/color2 유니폼이 갱신되지 않는 경우가 있어
    // 인스턴스를 완전히 재생성해 확실하게 새 테마 색상을 반영한다.
    if (heroVantaInstance) {
      initHeroVanta();
    }
    if (topologyInstances.length) {
      initTopologyBackgrounds();
    }
  }

  /* ---------- 색상 테마 전환 (기본 / 삼성 블루톤), 전 페이지 공통 localStorage로 유지 ---------- */
  function initThemeToggle() {
    var STORAGE_KEY = 'tnc-theme';
    var toggles = document.querySelectorAll('[data-theme-toggle]');
    if (!toggles.length) return;

    function apply(theme) {
      if (theme === 'samsung') {
        document.documentElement.setAttribute('data-theme', 'samsung');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      toggles.forEach(function (btn) {
        btn.setAttribute('aria-pressed', theme === 'samsung' ? 'true' : 'false');
        var label = btn.querySelector('[data-theme-toggle-label]');
        if (label) label.textContent = theme === 'samsung' ? '기본 테마' : '블루 테마';
      });
      var favicon = document.getElementById('favicon-icon');
      var appleIcon = document.getElementById('favicon-apple');
      var suffix = theme === 'samsung' ? 'blue' : 'orange';
      if (favicon) favicon.href = 'images/favicon-32-' + suffix + '.png';
      if (appleIcon) appleIcon.href = 'images/favicon-180-' + suffix + '.png';
      applyVantaTheme();
    }

    var current = document.documentElement.getAttribute('data-theme') === 'samsung' ? 'samsung' : 'default';
    apply(current);

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'samsung' ? 'default' : 'samsung';
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch (e) {
          // localStorage 접근 불가(프라이빗 모드 등) — 현재 페이지에서만 적용
        }
        apply(next);
      });
    });
  }

  /* ---------- 내비게이션 드롭다운 공통 닫기 헬퍼 (쇼핑몰 바로가기) ---------- */
  function closeNavDropdowns() {
    document.querySelectorAll('.nav-dropdown.is-open').forEach(function (dropdown) {
      dropdown.classList.remove('is-open');
      var toggle = dropdown.querySelector('[data-nav-dropdown-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---------- Mobile hamburger nav ---------- */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) closeNavDropdowns();
    });

    // Close menu when a nav link is clicked (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        closeNavDropdowns();
      });
    });

    // Close menu on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
        closeNavDropdowns();
      }
    });
  }

  /* ---------- 상단 내비게이션 드롭다운 (쇼핑몰 바로가기: 종합몰 + 제휴사 단독몰) ---------- */
  function initNavDropdowns() {
    var dropdowns = document.querySelectorAll('[data-nav-dropdown]');
    if (!dropdowns.length) return;

    dropdowns.forEach(function (dropdown) {
      var toggle = dropdown.querySelector('[data-nav-dropdown-toggle]');
      if (!toggle) return;

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = dropdown.classList.contains('is-open');
        closeNavDropdowns();
        if (!wasOpen) {
          dropdown.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // 바깥 영역 클릭 시 닫기
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-nav-dropdown]')) {
        closeNavDropdowns();
      }
    });

    // Esc 키로 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNavDropdowns();
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

  /* ---------- Hero background: 기본 테마 VANTA.DOTS / 블루 테마 VANTA.NET (three.js 기반, CDN 로드) ---------- */
  function initHeroVanta() {
    var el = document.getElementById('hero-vanta');
    if (!el) return;

    if (heroVantaInstance && heroVantaInstance.destroy) {
      heroVantaInstance.destroy();
      heroVantaInstance = null;
    }

    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // 정적 배경 그대로 둠

    if (typeof VANTA === 'undefined') return; // CDN 로드 실패 시 조용히 무시

    var isSamsung = document.documentElement.getAttribute('data-theme') === 'samsung';

    var isMobile = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) return; // 모바일에서는 배경 애니메이션 없이 정적 배경만 사용

    if (isSamsung) {
      // 블루 테마: 화이트 배경 전체에 별자리처럼 은은하게 연결되는 블루 파티클 네트워크로 고급스러운 느낌 연출
      // (텍스트 블록 뒤는 .hero__copy::before 화이트 광원으로 가려 가독성 확보 — styles.css 참고)
      if (!VANTA.NET) return;
      heroVantaInstance = VANTA.NET({
        el: el,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x1c4ed8,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0,
        points: 10.00,
        maxDistance: 22.00,
        spacing: 20.00,
        showDots: true
      });
    } else {
      if (!VANTA.DOTS) return;
      heroVantaInstance = VANTA.DOTS({
        el: el,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xf27405,
        color2: 0xf9a865,
        backgroundColor: 0x121110,
        backgroundAlpha: 0,
        size: 2.60,
        spacing: 26.00,
        showLines: false,
        speed: 1.7
      });
    }
  }

  /* ---------- Navy 섹션 배경: VANTA.TOPOLOGY (p5.js 기반, CDN 로드) ---------- */
  function initTopologyBackgrounds() {
    var targets = document.querySelectorAll('[data-vanta-topology]');
    if (!targets.length) return;

    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // 정적 배경 그대로 둠

    if (typeof VANTA === 'undefined' || !VANTA.TOPOLOGY) return; // CDN 로드 실패 시 조용히 무시

    topologyInstances.forEach(function (inst) {
      if (inst && inst.destroy) inst.destroy();
    });
    topologyInstances = [];

    var isSamsung = document.documentElement.getAttribute('data-theme') === 'samsung';

    targets.forEach(function (el) {
      var inst = VANTA.TOPOLOGY({
        el: el,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: isSamsung ? 0x2189ff : 0x913f0d,
        backgroundColor: isSamsung ? 0x1428a0 : 0x1b1917,
        backgroundAlpha: 1
      });
      topologyInstances.push(inst);
    });
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

  /* ---------- [v2] 실시간 예상 수익 시뮬레이터 ---------- */
  function initRevenueCalculator() {
    var rangeWater = document.getElementById('rangeWater');
    var rangeChair = document.getElementById('rangeChair');
    var rangeAppliance = document.getElementById('rangeAppliance');

    if (!rangeWater || !rangeChair || !rangeAppliance) return;

    var valWater = document.getElementById('valWater');
    var valChair = document.getElementById('valChair');
    var valAppliance = document.getElementById('valAppliance');

    var totalCountDisplay = document.getElementById('totalCountDisplay');
    var totalMonthlyDisplay = document.getElementById('totalMonthlyDisplay');
    var totalYearlyDisplay = document.getElementById('totalYearlyDisplay');

    var bdWaterCount = document.getElementById('bdWaterCount');
    var bdWaterSum = document.getElementById('bdWaterSum');
    var bdChairCount = document.getElementById('bdChairCount');
    var bdChairSum = document.getElementById('bdChairSum');
    var bdApplianceCount = document.getElementById('bdApplianceCount');
    var bdApplianceSum = document.getElementById('bdApplianceSum');

    var PRICE_WATER = 300000;      // 건당 30만 원
    var PRICE_CHAIR = 500000;      // 건당 50만 원
    var PRICE_APPLIANCE = 400000;  // 건당 40만 원

    function calculate() {
      var wCount = parseInt(rangeWater.value, 10) || 0;
      var cCount = parseInt(rangeChair.value, 10) || 0;
      var aCount = parseInt(rangeAppliance.value, 10) || 0;

      // 뱃지 건수 업데이트
      if (valWater) valWater.textContent = wCount;
      if (valChair) valChair.textContent = cCount;
      if (valAppliance) valAppliance.textContent = aCount;

      // 총 판매 건수
      var totalCount = wCount + cCount + aCount;
      if (totalCountDisplay) totalCountDisplay.textContent = totalCount;

      // 카테고리별 합산
      var sumWater = wCount * PRICE_WATER;
      var sumChair = cCount * PRICE_CHAIR;
      var sumAppliance = aCount * PRICE_APPLIANCE;
      var monthlyTotal = sumWater + sumChair + sumAppliance;
      var yearlyTotal = monthlyTotal * 12;

      // 내역 표기
      if (bdWaterCount) bdWaterCount.textContent = wCount;
      if (bdWaterSum) bdWaterSum.textContent = (sumWater / 10000).toLocaleString('ko-KR') + '만 원';

      if (bdChairCount) bdChairCount.textContent = cCount;
      if (bdChairSum) bdChairSum.textContent = (sumChair / 10000).toLocaleString('ko-KR') + '만 원';

      if (bdApplianceCount) bdApplianceCount.textContent = aCount;
      if (bdApplianceSum) bdApplianceSum.textContent = (sumAppliance / 10000).toLocaleString('ko-KR') + '만 원';

      // 최종 월 수익
      if (totalMonthlyDisplay) {
        totalMonthlyDisplay.textContent = monthlyTotal.toLocaleString('ko-KR');
      }

      // 최종 연 환산 수익
      if (totalYearlyDisplay) {
        var yearlyMan = Math.round(yearlyTotal / 10000);
        if (yearlyMan >= 10000) {
          var eok = Math.floor(yearlyMan / 10000);
          var restMan = yearlyMan % 10000;
          totalYearlyDisplay.textContent = '약 ' + eok + '억 ' + (restMan > 0 ? restMan.toLocaleString('ko-KR') + '만 ' : '') + '원';
        } else {
          totalYearlyDisplay.textContent = '약 ' + yearlyMan.toLocaleString('ko-KR') + '만 원';
        }
      }
    }

    rangeWater.addEventListener('input', calculate);
    rangeChair.addEventListener('input', calculate);
    rangeAppliance.addEventListener('input', calculate);

    calculate();
  }

  /* ---------- FAQ 답변 타이핑 애니메이션 공통 헬퍼 ---------- */
  function typewriterReveal(el, html, speed) {
    if (el.__typeTimer) {
      clearInterval(el.__typeTimer);
      el.__typeTimer = null;
    }
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var text = tmp.textContent || '';
    el.textContent = '';
    el.classList.add('is-typing');
    var i = 0;
    el.__typeTimer = setInterval(function () {
      i++;
      el.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(el.__typeTimer);
        el.__typeTimer = null;
        el.innerHTML = html;
        el.classList.remove('is-typing');
      }
    }, speed || 16);
  }

  function resetTypewriter(el) {
    if (el.__typeTimer) {
      clearInterval(el.__typeTimer);
      el.__typeTimer = null;
    }
    el.classList.remove('is-typing');
    el.textContent = '';
  }

  /* ---------- [v2] FAQ 아코디언 토글 (Q1~Q5, 열 때마다 타이핑 애니메이션 재생) ---------- */
  function initFaqAccordion() {
    var accordion = document.getElementById('faqAccordion');
    if (!accordion) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var buttons = accordion.querySelectorAll('.faq-item__question');

    buttons.forEach(function (btn) {
      var targetId = btn.getAttribute('aria-controls');
      var answer = document.getElementById(targetId);
      if (answer) answer.__faqFullHTML = answer.innerHTML;

      btn.addEventListener('click', function () {
        var isExpanded = btn.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
          btn.setAttribute('aria-expanded', 'false');
          if (answer) {
            answer.setAttribute('hidden', '');
            answer.classList.remove('is-open');
            resetTypewriter(answer);
          }
        } else {
          btn.setAttribute('aria-expanded', 'true');
          if (answer) {
            answer.removeAttribute('hidden');
            answer.classList.add('is-open');
            if (reduceMotion) {
              answer.innerHTML = answer.__faqFullHTML;
            } else {
              typewriterReveal(answer, answer.__faqFullHTML, 14);
            }
          }
        }
      });
    });
  }

  /* ---------- [v2] 창업비용 페이지 FAQ (<details>) — 열 때마다 타이핑 애니메이션 재생 ---------- */
  function initDetailsFaqTypewriter() {
    var items = document.querySelectorAll('.faq-list .faq-item');
    if (!items.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    items.forEach(function (details) {
      var answer = details.querySelector('.faq-item__a');
      if (!answer) return;
      answer.__faqFullHTML = answer.innerHTML;

      details.addEventListener('toggle', function () {
        if (details.open) {
          if (reduceMotion) {
            answer.innerHTML = answer.__faqFullHTML;
          } else {
            typewriterReveal(answer, answer.__faqFullHTML, 14);
          }
        } else {
          resetTypewriter(answer);
        }
      });
    });
  }

  /* ---------- [v2] 24H AI 상담 실시간 채팅 시뮬레이션 (렌탈료 비교/프로모션/제휴카드/추천상품) ---------- */
  function initAiChatDemo() {
    var log = document.getElementById('chatLog');
    var bar = document.getElementById('chatBar');
    var typedTextEl = document.getElementById('chatTypedText');
    var sendBtn = document.getElementById('chatSendBtn');
    if (!log || !bar || !typedTextEl) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var PRODUCT_NAME = '코웨이 아이콘 정수기 CHP-6210L (3년 약정)';

    var turns = [
      {
        q: '다른 렌탈사보다 비싼가요?',
        intro: '고객님이 보고 계신 <strong>코웨이 아이콘 정수기 CHP-6210L</strong> 기준으로 주요 렌탈사 월 요금을 비교해드릴게요.',
        bullets: [
          '<strong>코웨이 다이렉트</strong> 39,900원 · 자가관리형 기준가',
          '<strong>SK매직 직영</strong> 35,900원 · 6개월 프로모션가',
          '<strong>티앤씨 파트너몰</strong> 32,900원 · 본사 직거래 최저가'
        ],
        outro: '같은 모델도 가입 경로에 따라 최대 7,000원까지 차이가 나요. 지금처럼 진행하시면 가장 유리한 조건으로 계약하실 수 있어요!'
      },
      {
        q: '이번 달 진행 중인 프로모션이 궁금해요',
        intro: '네! 이번 달 한정으로 진행 중인 혜택을 안내해드릴게요.',
        bullets: [
          '<strong>3개월 렌탈료 50% 할인</strong> · 첫 납부 부담을 크게 낮춰드려요',
          '<strong>사은품 증정</strong> · 신청 즉시 소형가전 사은품 1종 무료 증정',
          '<strong>장기약정 추가할인</strong> · 5년 약정 시 매달 2,000원 추가 할인'
        ],
        outro: '프로모션은 이달 말까지만 적용되니 서둘러 상담받아보시는 걸 추천드려요!'
      },
      {
        q: '제휴카드로 더 할인 받을 수 있나요?',
        intro: '보유하신 카드에 따라 추가 할인을 받으실 수 있어요.',
        bullets: [
          '<strong>신한카드</strong> 매달 자동이체 시 8,000원 청구할인',
          '<strong>삼성카드</strong> 매달 자동이체 시 7,000원 청구할인',
          '<strong>현대카드</strong> 매달 자동이체 시 7,000원 청구할인'
        ],
        outro: '카드 실적 조건은 카드사별로 상이하니, 보유 카드를 알려주시면 정확한 할인 조건을 바로 확인해드릴게요!'
      },
      {
        q: '이 상품과 비슷한 상품도 추천해줘',
        intro: '고객님 취향에 맞춰 함께 보면 좋은 상품을 추천해드려요.',
        bullets: [
          '<strong>안마의자</strong> · 하루 피로를 풀어주는 인기 재구매 1위 상품',
          '<strong>매트리스</strong> · 정수기와 함께 렌탈 시 설치비 무료 혜택',
          '<strong>공기청정기</strong> · 미세먼지 심한 환절기 필수템, 결합 할인 가능'
        ],
        outro: '관심 있는 상품을 말씀해주시면 바로 견적을 안내해드릴게요!'
      }
    ];

    function buildIntroEl() {
      var el = document.createElement('div');
      el.className = 'chat-intro';
      el.innerHTML =
        '<span class="chat-app__tag">렌탈</span>' +
        '<h4 class="chat-app__title">AI 상담과<br>대화를 시작해볼까요?</h4>' +
        '<div class="chat-app__product"><span>지금 보고 계신 상품</span><strong>' + PRODUCT_NAME + '</strong></div>';
      return el;
    }

    function buildUserMsgEl(text) {
      var el = document.createElement('div');
      el.className = 'chat-log-msg chat-log-msg--user';
      el.innerHTML = '<span class="chat-bubble"></span>';
      el.querySelector('.chat-bubble').textContent = text;
      return el;
    }

    function buildTypingEl() {
      var el = document.createElement('div');
      el.className = 'chat-log-msg chat-log-msg--ai';
      el.innerHTML =
        '<div class="chat-ai-head"><span class="chat-avatar">AI</span><span class="chat-ai-name">AI 상담사</span><span class="chat-online-dot"></span></div>' +
        '<div class="chat-typing-row"><i></i><i></i><i></i></div>';
      return el;
    }

    function buildAnswerEl(turn) {
      var el = document.createElement('div');
      el.className = 'chat-log-msg chat-log-msg--ai';
      var bullets = turn.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('');
      el.innerHTML =
        '<div class="chat-ai-head"><span class="chat-avatar">AI</span><span class="chat-ai-name">AI 상담사</span><span class="chat-online-dot"></span></div>' +
        '<div class="chat-ai-answer">' +
          '<p>' + turn.intro + '</p>' +
          '<ul>' + bullets + '</ul>' +
          '<p>' + turn.outro + '</p>' +
        '</div>';
      return el;
    }

    function scrollToBottom() {
      log.scrollTop = log.scrollHeight;
    }

    // 접근성: 동작 최소화 선호 시 애니메이션 없이 전체 대화를 정적으로 표시
    if (reduceMotion) {
      var introStatic = buildIntroEl();
      introStatic.classList.add('is-in');
      log.appendChild(introStatic);
      turns.forEach(function (turn) {
        var u = buildUserMsgEl(turn.q);
        u.classList.add('is-in');
        log.appendChild(u);
        var a = buildAnswerEl(turn);
        a.classList.add('is-in');
        log.appendChild(a);
      });
      return;
    }

    var timer = null;
    var turnIndex = 0;

    function typeIntoBar(text, cb) {
      bar.classList.add('is-typing');
      typedTextEl.textContent = '';
      var idx = 0;
      function step() {
        if (idx <= text.length) {
          typedTextEl.textContent = text.slice(0, idx);
          idx++;
          timer = setTimeout(step, 38 + Math.random() * 34);
        } else {
          timer = setTimeout(cb, 450);
        }
      }
      step();
    }

    function resetBar() {
      bar.classList.remove('is-typing');
      typedTextEl.textContent = '';
    }

    function runTurn() {
      if (turnIndex >= turns.length) {
        timer = setTimeout(function () {
          log.classList.add('is-fading');
          timer = setTimeout(function () {
            log.innerHTML = '';
            log.classList.remove('is-fading');
            turnIndex = 0;
            var intro = buildIntroEl();
            log.appendChild(intro);
            requestAnimationFrame(function () { intro.classList.add('is-in'); });
            timer = setTimeout(runTurn, 1800);
          }, 420);
        }, 2400);
        return;
      }

      var turn = turns[turnIndex++];

      typeIntoBar(turn.q, function () {
        if (sendBtn) {
          sendBtn.classList.add('is-active');
          setTimeout(function () { sendBtn.classList.remove('is-active'); }, 220);
        }
        resetBar();

        var userEl = buildUserMsgEl(turn.q);
        log.appendChild(userEl);
        scrollToBottom();
        requestAnimationFrame(function () { userEl.classList.add('is-in'); });

        timer = setTimeout(function () {
          var typingEl = buildTypingEl();
          log.appendChild(typingEl);
          scrollToBottom();
          requestAnimationFrame(function () { typingEl.classList.add('is-in'); });

          timer = setTimeout(function () {
            typingEl.remove();
            var answerEl = buildAnswerEl(turn);
            log.appendChild(answerEl);
            scrollToBottom();
            requestAnimationFrame(function () { answerEl.classList.add('is-in'); });

            timer = setTimeout(runTurn, 3200);
          }, 1000);
        }, 450);
      });
    }

    var firstIntro = buildIntroEl();
    log.appendChild(firstIntro);
    requestAnimationFrame(function () { firstIntro.classList.add('is-in'); });
    timer = setTimeout(runTurn, 1800);
  }

  /* ---------- [v2] 1분 간편 상담 폼 피드백 및 전화번호 포맷팅 ---------- */
  function initQuickLeadForm() {
    var form = document.getElementById('quickLeadForm');
    if (!form) return;

    var phoneInput = document.getElementById('leadPhone');
    var statusBox = document.getElementById('quickLeadStatus');

    // 휴대폰 번호 자동 하이픈 (-) 서식화
    if (phoneInput) {
      phoneInput.addEventListener('input', function (e) {
        var num = e.target.value.replace(/[^0-9]/g, '');
        if (num.length < 4) {
          e.target.value = num;
        } else if (num.length < 8) {
          e.target.value = num.substr(0, 3) + '-' + num.substr(3);
        } else if (num.length <= 11) {
          e.target.value = num.substr(0, 3) + '-' + num.substr(3, 4) + '-' + num.substr(7);
        } else {
          e.target.value = num.substr(0, 3) + '-' + num.substr(3, 4) + '-' + num.substr(7, 4);
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('leadName');

      var nameVal = nameInput ? nameInput.value.trim() : '';
      var phoneVal = phoneInput ? phoneInput.value.replace(/[^0-9]/g, '') : '';

      if (!nameVal) {
        if (statusBox) {
          statusBox.textContent = '성함 또는 대표자명을 입력해주세요.';
          statusBox.className = 'quick-lead-status is-error';
        }
        if (nameInput) nameInput.focus();
        return;
      }

      if (phoneVal.length < 9 || phoneVal.length > 11) {
        if (statusBox) {
          statusBox.textContent = '올바른 휴대폰 번호를 입력해주세요.';
          statusBox.className = 'quick-lead-status is-error';
        }
        if (phoneInput) phoneInput.focus();
        return;
      }

      // 성공 피드백
      if (statusBox) {
        statusBox.textContent = '✓ 신청이 완료되었습니다! 24시간 내로 전문 컨설턴트가 연락드리겠습니다.';
        statusBox.className = 'quick-lead-status is-success';
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '상담 접수 완료';
      }
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    initNav();
    initNavDropdowns();
    initHeroVanta();
    initTopologyBackgrounds();
    initReveal();
    initCounters();
    initMarketChart();
    initYear();
    initContactForm();
    initKakaoMap();
    initRevenueCalculator();
    initFaqAccordion();
    initDetailsFaqTypewriter();
    initQuickLeadForm();
    initAiChatDemo();
  });
})();


