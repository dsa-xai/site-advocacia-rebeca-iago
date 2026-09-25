/* site.js — status (online/plantão) badge logic + FaleConosco WhatsApp-routing widget
   Vanilla-JS re-implementation of the original Design-canvas components, so the
   exported static site keeps the same live behavior without the canvas runtime. */
(function () {
  'use strict';

  var WHATSAPP_DEFAULT = '5522997600323';
  var EMAIL = 'adv.rebecapaschoal@gmail.com';

  // ---------------------------------------------------------------------
  // Business-hours status (Online / Plantão)
  // ---------------------------------------------------------------------
  function computeStatus(mode) {
    mode = mode || 'auto';
    var online = mode === 'online';
    if (mode === 'auto') {
      try {
        var parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Sao_Paulo',
          weekday: 'short',
          hour: 'numeric',
          hourCycle: 'h23'
        }).formatToParts(new Date());
        var wd = (parts.filter(function (p) { return p.type === 'weekday'; })[0] || {}).value;
        var h = parseInt((parts.filter(function (p) { return p.type === 'hour'; })[0] || {}).value, 10);
        online = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(wd) >= 0 && h >= 9 && h < 18;
      } catch (e) {
        var d = new Date();
        online = d.getDay() >= 1 && d.getDay() <= 5 && d.getHours() >= 9 && d.getHours() < 18;
      }
    }
    return {
      statusMode: mode,
      statusLabel: online ? 'Online' : 'Plantão',
      statusTitle: online ? 'Equipe online agora' : 'Fora do horário comercial: atendimento em regime de plantão',
      statusDot: online ? '#22A35A' : '#E5A800',
      statusText: online ? '#17693A' : '#7A5200',
      statusOnDark: online ? '#7ADFA0' : '#F2C94C',
      statusChipBg: online ? '#E6F4EA' : '#FBF1D6'
    };
  }

  var currentStatus = computeStatus('auto');

  function applyStatus() {
    currentStatus = computeStatus('auto');
    var s = currentStatus;

    document.querySelectorAll('.js-status-chip').forEach(function (el) {
      el.title = s.statusTitle;
      el.style.background = s.statusChipBg;
      el.style.color = s.statusText;
    });
    document.querySelectorAll('.js-status-chip-dark').forEach(function (el) {
      el.title = s.statusTitle;
    });
    document.querySelectorAll('.js-status-dot').forEach(function (el) {
      el.style.background = s.statusDot;
    });
    document.querySelectorAll('.js-status-label').forEach(function (el) {
      el.textContent = s.statusLabel;
    });
    document.querySelectorAll('.js-status-text-color').forEach(function (el) {
      el.style.color = s.statusText;
    });
    document.querySelectorAll('.js-status-label-dark').forEach(function (el) {
      el.textContent = s.statusLabel;
      el.style.color = s.statusOnDark;
    });
    document.querySelectorAll('.js-status-aria').forEach(function (el) {
      el.setAttribute('aria-label', 'Falar pelo WhatsApp — ' + s.statusLabel);
    });

    document.querySelectorAll('[data-faleconosco]').forEach(function (el) {
      if (el.__updateStatus) { el.__updateStatus(s); }
    });
  }

  // ---------------------------------------------------------------------
  // FaleConosco — guided WhatsApp/e-mail routing widget
  // ---------------------------------------------------------------------
  var TOPICS_PREV = ['Benefício negado ou cortado', 'Aposentadoria', 'BPC/LOAS', 'Auxílio-doença', 'Pensão por morte', 'Revisão de benefício'];
  var TOPICS_TRAB = ['Trabalhista — sou trabalhador', 'Trabalhista — sou empresa'];
  var TOPICS_CIV = ['Direito Civil'];

  function routeTopic(t) {
    if (TOPICS_PREV.indexOf(t) >= 0) return { hi: 'Olá, Dra. Rebeca!', name: 'Dra. Rebeca Paschoal Machado', area: 'Direito Previdenciário', subj: 'Direito Previdenciário — ' + t };
    if (TOPICS_TRAB.indexOf(t) >= 0) return { hi: 'Olá, Dr. Iago!', name: 'Dr. Iago Santos de Souza', area: 'Direito Trabalhista', subj: t.replace('Trabalhista — ', 'Direito Trabalhista — ') };
    if (TOPICS_CIV.indexOf(t) >= 0) return { hi: 'Olá, Dra. Rebeca e Dr. Iago!', name: 'Dra. Rebeca e Dr. Iago', area: 'Direito Civil', subj: 'Direito Civil' };
    return { hi: 'Olá!', name: 'Equipe do escritório', area: 'Triagem inicial', subj: 'outro assunto' };
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function initFaleConosco(root) {
    var area = root.getAttribute('data-area') || 'all';
    var whatsapp = (root.getAttribute('data-whatsapp') || WHATSAPP_DEFAULT).replace(/\D/g, '');
    var state = { topic: null, mode: null };

    var BTN_BASE = 'min-height:44px;padding:10px 16px;border-radius:22px;font-family:\'Public Sans\',system-ui,sans-serif;font-size:14.5px;font-weight:600;line-height:1.2;cursor:pointer;text-align:left;';
    var BTN_ON = BTN_BASE + 'background:#12203C;color:#F7F4EE;border:1px solid #12203C;';
    var BTN_OFF = BTN_BASE + 'background:#FFFFFF;color:#12203C;border:1px solid #CFC5AC;';

    function topicList() {
      var list = area === 'prev' ? TOPICS_PREV.concat(['Outro assunto'])
        : area === 'trab' ? TOPICS_TRAB.concat(['Outro assunto'])
        : area === 'civel' ? TOPICS_CIV.concat(['Outro assunto'])
        : TOPICS_PREV.concat(TOPICS_TRAB, TOPICS_CIV, ['Outro assunto']);
      return list;
    }

    function render(status) {
      var s = status || currentStatus;
      var topic = state.topic, mode = state.mode;
      var hasTopic = !!topic, ready = !!(topic && mode);
      var step = !topic ? 1 : (!mode ? 2 : 3);
      var r = routeTopic(topic);
      var message = r.hi + ' Vim pelo site e gostaria de falar sobre ' + r.subj + '. Prefiro atendimento por: ' + (mode || '') + '.';
      var waLink = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(message);
      var mailLink = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Contato pelo site — ' + r.subj + ' (' + r.name + ')') + '&body=' + encodeURIComponent(message);

      var topicsHtml = topicList().map(function (label, i) {
        var pressed = topic === label;
        return '<button type="button" data-fc-topic="' + i + '" aria-pressed="' + pressed + '" style="' + (pressed ? BTN_ON : BTN_OFF) + '">' + esc(label) + '</button>';
      }).join('');

      var modesHtml = ['Mensagem no WhatsApp', 'Ligação', 'Videochamada', 'Presencial no escritório'].map(function (label, i) {
        var pressed = mode === label;
        return '<button type="button" data-fc-mode="' + i + '" aria-pressed="' + pressed + '" style="' + (pressed ? BTN_ON : BTN_OFF) + '">' + esc(label) + '</button>';
      }).join('');

      var html = '';
      html += '<div style="width:100%;display:flex;flex-direction:column;box-sizing:border-box;background:#FFFFFF;border:1px solid #D9CFB8;box-shadow:0 18px 48px rgba(11,20,39,0.18);font-family:\'Public Sans\',system-ui,sans-serif;color:#1A1A1A;">';

      html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 24px;background:#0F1B33;">';
      html += '<div style="display:flex;align-items:center;gap:12px;">';
      html += '<img src="assets/logo.png" alt="" width="40" height="40" style="width:40px;height:40px;display:block;">';
      html += '<div style="display:flex;flex-direction:column;gap:2px;">';
      html += '<span style="font-family:\'Playfair Display\',Georgia,serif;font-size:17px;font-weight:600;color:#F7F4EE;">[Nome do escritório]</span>';
      html += '<span title="' + esc(s.statusTitle) + '" style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#A9B3C7;"><span style="position:relative;flex:0 0 8px;width:8px;height:8px;display:inline-block;"><span class="status-ring" style="position:absolute;top:0;left:0;width:8px;height:8px;border-radius:50%;background:' + s.statusDot + ';"></span><span style="position:absolute;top:0;left:0;width:8px;height:8px;border-radius:50%;background:' + s.statusDot + ';"></span></span><span style="font-weight:700;color:' + s.statusOnDark + ';">' + s.statusLabel + '</span><span>· seg. a sex., 09h às 18h</span></span>';
      html += '</div></div>';
      html += '<span style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#C9A45C;font-weight:600;white-space:nowrap;">Passo ' + step + ' de 3</span>';
      html += '</div>';

      html += '<div style="display:flex;flex-direction:column;gap:18px;padding:28px 24px;background:#F7F4EE;">';

      html += '<div style="display:flex;gap:10px;align-items:flex-start;">';
      html += '<img src="assets/logo.png" alt="" width="32" height="32" style="width:32px;height:32px;display:block;flex:0 0 32px;">';
      html += '<div style="max-width:440px;padding:14px 16px;background:#FFFFFF;border:1px solid #E4DECD;border-radius:4px 16px 16px 16px;font-size:15.5px;line-height:1.5;color:#12203C;">Olá! Sobre o que você quer falar?</div>';
      html += '</div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:10px;padding-left:42px;">' + topicsHtml + '</div>';

      if (hasTopic) {
        html += '<div style="display:flex;flex-direction:column;gap:18px;">';
        html += '<div style="display:flex;justify-content:flex-end;"><div style="max-width:400px;padding:12px 16px;background:#12203C;border-radius:16px 4px 16px 16px;font-size:15px;line-height:1.5;color:#F7F4EE;">' + esc(topic) + '</div></div>';
        html += '<div style="display:flex;gap:10px;align-items:flex-start;">';
        html += '<img src="assets/logo.png" alt="" width="32" height="32" style="width:32px;height:32px;display:block;flex:0 0 32px;">';
        html += '<div style="max-width:440px;padding:14px 16px;background:#FFFFFF;border:1px solid #E4DECD;border-radius:4px 16px 16px 16px;font-size:15.5px;line-height:1.5;color:#12203C;">Certo. Como você prefere ser atendido?</div>';
        html += '</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:10px;padding-left:42px;">' + modesHtml + '</div>';
        html += '</div>';
      }

      if (ready) {
        html += '<div style="display:flex;flex-direction:column;gap:18px;">';
        html += '<div style="display:flex;justify-content:flex-end;"><div style="max-width:400px;padding:12px 16px;background:#12203C;border-radius:16px 4px 16px 16px;font-size:15px;line-height:1.5;color:#F7F4EE;">' + esc(mode) + '</div></div>';
        html += '<div style="display:flex;gap:10px;align-items:flex-start;">';
        html += '<img src="assets/logo.png" alt="" width="32" height="32" style="width:32px;height:32px;display:block;flex:0 0 32px;">';
        html += '<div style="flex:1 1 0;max-width:460px;display:flex;flex-direction:column;gap:12px;padding:16px;background:#FFFFFF;border:1px solid #E4DECD;border-radius:4px 16px 16px 16px;">';
        html += '<span style="display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid #EFE9DC;"><span style="flex:0 0 auto;font-size:11.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8C6A2F;font-weight:700;">Para</span><span style="display:flex;flex-direction:column;gap:1px;"><span style="font-family:\'Playfair Display\',Georgia,serif;font-size:16px;color:#12203C;">' + esc(r.name) + '</span><span style="font-size:12.5px;color:#6B634A;font-weight:600;">' + esc(r.area) + '</span></span></span>';
        html += '<span style="font-size:15.5px;line-height:1.5;color:#12203C;">Pronto! É só enviar. A conversa já vai com esta mensagem:</span>';
        html += '<span style="padding:12px 14px;background:#F7F4EE;border:1px dashed #CFC5AC;border-radius:8px;font-size:14.5px;line-height:1.55;color:#3A3626;font-style:italic;">“' + esc(message) + '”</span>';
        html += '</div></div>';
        html += '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding-left:42px;">';
        html += '<a href="' + waLink + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;min-height:50px;padding:0 24px;background:#B08D45;color:#0F1B33;font-size:15px;font-weight:700;border-radius:26px;text-decoration:none;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 5h16v11H10l-5 4v-4H4z" stroke="#0F1B33" stroke-width="1.8" stroke-linejoin="round"></path></svg>Enviar pelo WhatsApp</a>';
        html += '<a href="' + mailLink + '" style="display:inline-flex;align-items:center;min-height:50px;padding:0 20px;border:1px solid #12203C;color:#12203C;font-size:14.5px;font-weight:600;border-radius:26px;text-decoration:none;">Prefiro e-mail</a>';
        html += '<button type="button" data-fc-reset="1" style="min-height:44px;padding:0 8px;background:transparent;border:0;font-family:\'Public Sans\',system-ui,sans-serif;font-size:14px;font-weight:600;color:#6B634A;text-decoration:underline;cursor:pointer;">Recomeçar</button>';
        html += '</div></div>';
      }

      html += '</div>';

      html += '<div style="display:flex;align-items:center;gap:10px;padding:14px 24px;border-top:1px solid #E4DECD;background:#FFFFFF;">';
      html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5" stroke="#8C6A2F" stroke-width="1.6"></rect><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="#8C6A2F" stroke-width="1.6"></path></svg>';
      html += '<span style="font-size:12.5px;line-height:1.5;color:#6B634A;">Sem formulário e sem cadastro. A conversa continua no seu WhatsApp, com sigilo profissional.</span>';
      html += '</div>';

      html += '</div>';

      root.innerHTML = html;

      var topicLabels = topicList();
      root.querySelectorAll('[data-fc-topic]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.topic = topicLabels[parseInt(btn.getAttribute('data-fc-topic'), 10)];
          render();
        });
      });
      var modeLabels = ['Mensagem no WhatsApp', 'Ligação', 'Videochamada', 'Presencial no escritório'];
      root.querySelectorAll('[data-fc-mode]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.mode = modeLabels[parseInt(btn.getAttribute('data-fc-mode'), 10)];
          render();
        });
      });
      var resetBtn = root.querySelector('[data-fc-reset]');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          state = { topic: null, mode: null };
          render();
        });
      }
    }

    root.__updateStatus = function (s) { render(s); };
    render(currentStatus);
  }

  // ---------------------------------------------------------------------
  // FAQ accordion (Previdenciário page)
  // ---------------------------------------------------------------------
  function initFaqAccordion(group) {
    var items = group.querySelectorAll('[data-faq-item]');
    function setOpen(openIndex) {
      items.forEach(function (item, i) {
        var btn = item.querySelector('[data-faq-toggle]');
        var panel = item.querySelector('[data-faq-panel]');
        var plus = item.querySelector('[data-faq-plus]');
        var isOpen = i === openIndex;
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        panel.style.display = isOpen ? '' : 'none';
        if (plus) { plus.style.display = isOpen ? 'none' : ''; }
      });
    }
    items.forEach(function (item, i) {
      var btn = item.querySelector('[data-faq-toggle]');
      btn.addEventListener('click', function () {
        var nowOpen = btn.getAttribute('aria-expanded') === 'true';
        setOpen(nowOpen ? -1 : i);
      });
    });
    setOpen(0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyStatus();
    setInterval(applyStatus, 60000);
    document.querySelectorAll('[data-faleconosco]').forEach(initFaleConosco);
    document.querySelectorAll('[data-faq-group]').forEach(initFaqAccordion);
  });
})();
