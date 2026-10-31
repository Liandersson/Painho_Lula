(function () {
  'use strict';

  var AUDIO_EXTENSIONS = /\.(mp3|m4a|mpa|aac|flac|ogg|wma|wav|mid|midi|ape|aif|aiff)$/i;
  var app = {
    storages: [],
    storage: null,
    folderStack: [],
    entries: [],
    queue: [],
    queueIndex: -1,
    currentFile: null,
    view: 'usb',
    fullAppOpen: false,
  };
  var $ = function (id) { return document.getElementById(id); };
  var audio = $('audio');

  function setStatus(message) { $('status').textContent = message; }
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    var total = Math.floor(seconds);
    return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
  }
  function humanBytes(bytes) {
    if (!bytes || bytes < 0) return '';
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  function errorText(error) {
    return error && error.message ? error.message : 'Não foi possível acessar este item.';
  }
  function callAsync(target, method, args) {
    return new Promise(function (resolve, reject) {
      try {
        target[method].apply(target, args.concat([resolve, reject]));
      } catch (error) { reject(error); }
    });
  }
  function storageLabel(storage) {
    return storage.label.replace(/^removable_/, 'USB ');
  }
  function listStorages() {
    if (!window.tizen || !tizen.filesystem) {
      $('storage-list').innerHTML = '';
      setStatus('Abra este app como aplicativo Tizen na TV para acessar pendrives.');
      return;
    }
    setStatus('Procurando dispositivos USB…');
    tizen.filesystem.listStorages(function (items) {
      app.storages = items.filter(function (item) {
        return item.label.indexOf('removable_') === 0 && item.state === 'MOUNTED';
      });
      renderStorages();
      if (!app.storages.length) {
        app.storage = null;
        app.entries = [];
        renderFiles();
        $('source-label').textContent = 'Conecte um USB';
        setStatus('Nenhum pendrive montado. Conecte um USB e selecione Atualizar.');
        return;
      }
      if (!app.storage || !app.storages.some(function (item) { return item.label === app.storage.label; })) {
        selectStorage(app.storages[0]);
      } else {
        setStatus(app.storages.length + ' dispositivo(s) USB disponível(is).');
      }
    }, function (error) {
      setStatus('Falha ao procurar os dispositivos: ' + errorText(error));
    });
  }
  function renderStorages() {
    var list = $('storage-list');
    list.innerHTML = '';
    app.storages.forEach(function (storage, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'storage-chip' + (app.storage && storage.label === app.storage.label ? ' selected' : '');
      button.textContent = storageLabel(storage) + (app.storages.length > 1 ? ' ' + (index + 1) : '');
      button.setAttribute('data-focusable', '');
      button.addEventListener('click', function () { selectStorage(storage); });
      list.appendChild(button);
    });
  }
  function selectStorage(storage) {
    app.storage = storage;
    app.folderStack = [];
    app.queue = [];
    app.queueIndex = -1;
    $('source-label').textContent = storageLabel(storage);
    renderStorages();
    readCurrentFolder();
  }
  function currentDirectory() {
    return app.folderStack.length ? app.folderStack[app.folderStack.length - 1].file : null;
  }
  function readCurrentFolder() {
    if (!app.storage) return;
    var folder = currentDirectory();
    var path = folder ? folder.fullPath : app.storage.label;
    $('breadcrumb').textContent = path.replace(/^removable_[^/]+\/?/, '') || storageLabel(app.storage);
    $('up-button').hidden = app.folderStack.length === 0;
    setStatus('Lendo ' + (folder ? folder.name : storageLabel(app.storage)) + '…');
    var resolved = function (dir) {
      callAsync(dir, 'listFiles', []).then(function (files) {
        app.entries = files.filter(function (file) {
          return file.isDirectory || (file.isFile && AUDIO_EXTENSIONS.test(file.name));
        }).sort(function (a, b) {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
        });
        renderFiles();
        var count = app.entries.filter(function (file) { return file.isFile; }).length;
        setStatus(count ? count + ' faixa(s) nesta pasta.' : 'Nenhum arquivo de áudio nesta pasta.');
      }).catch(function (error) {
        app.entries = [];
        renderFiles();
        setStatus('Não consegui ler essa pasta: ' + errorText(error));
      });
    };
    if (folder) resolved(folder);
    else tizen.filesystem.resolve(app.storage.label, resolved, function (error) {
      setStatus('Não consegui abrir o USB: ' + errorText(error));
    }, 'r');
  }
  function renderFiles() {
    var list = $('file-list');
    list.innerHTML = '';
    if (!app.entries.length) return;
    app.entries.forEach(function (file) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'file-row' + (file.isDirectory ? ' folder' : '');
      button.setAttribute('data-focusable', '');
      var icon = document.createElement('span');
      icon.className = 'file-icon';
      icon.textContent = file.isDirectory ? '▰' : '♫';
      var name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = file.isDirectory ? file.name : displayName(file.name).title;
      var meta = document.createElement('span');
      meta.className = 'file-meta';
      meta.textContent = file.isDirectory ? 'Pasta　›' : humanBytes(file.fileSize);
      button.appendChild(icon);
      button.appendChild(name);
      button.appendChild(meta);
      button.addEventListener('click', function () {
        if (file.isDirectory) {
          app.folderStack.push({ file: file, name: file.name });
          readCurrentFolder();
        } else {
          var tracks = app.entries.filter(function (entry) { return entry.isFile && AUDIO_EXTENSIONS.test(entry.name); });
          app.queue = tracks;
          app.queueIndex = tracks.indexOf(file);
          playFile(file);
        }
      });
      list.appendChild(button);
    });
  }
  function displayName(filename) {
    var base = filename.replace(/\.[^.]+$/, '');
    var split = base.split(' - ');
    return split.length > 1 ? { artist: split.shift().trim(), title: split.join(' - ').trim() } : { artist: '', title: base };
  }
  function playFile(file) {
    try {
      app.currentFile = file;
      audio.src = file.toURI();
      audio.load();
      audio.play().then(function () {
        setStatus('Reproduzindo do USB.');
      }).catch(function (error) {
        setStatus('A TV não conseguiu iniciar este arquivo: ' + errorText(error));
      });
      var info = displayName(file.name);
      $('track-title').textContent = info.title;
      $('track-subtitle').textContent = info.artist || storageLabel(app.storage);
      $('play-pause').textContent = 'Ⅱ';
      $('play-pause').setAttribute('aria-label', 'Pausar');
    } catch (error) {
      setStatus('Não consegui abrir a faixa: ' + errorText(error));
    }
  }
  function playStream() {
    var field = $('stream-url');
    var value = field.value.trim();
    if (!/^https?:\/\//i.test(value)) {
      setStatus('Digite um endereço de áudio começando com http:// ou https://.');
      field.focus();
      return;
    }
    try {
      app.currentFile = null;
      app.queue = [];
      app.queueIndex = -1;
      audio.src = value;
      audio.load();
      audio.play().then(function () { setStatus('Reproduzindo o endereço de áudio.'); })
        .catch(function (error) { setStatus('A TV não conseguiu abrir esse endereço: ' + errorText(error)); });
      $('track-title').textContent = value.split('/').pop().split('?')[0] || 'Stream de áudio';
      $('track-subtitle').textContent = 'Endereço direto informado por você';
      $('play-pause').textContent = 'Ⅱ';
      $('play-pause').setAttribute('aria-label', 'Pausar');
      localStorage.setItem('painho-tv-stream-url', value);
      $('source-label').textContent = 'URL informada';
    } catch (error) {
      setStatus('Não consegui abrir o endereço: ' + errorText(error));
    }
  }
  function togglePlayback() {
    if (!audio.src) {
      if (app.queueIndex >= 0 && app.queue[app.queueIndex]) playFile(app.queue[app.queueIndex]);
      else setStatus('Escolha uma faixa ou informe um endereço de áudio.');
      return;
    }
    if (audio.paused) {
      audio.play().then(function () { setStatus('Reproduzindo.'); }).catch(function (error) { setStatus(errorText(error)); });
    } else audio.pause();
  }
  function playQueueAt(index) {
    if (!app.queue.length) return;
    var nextIndex = (index + app.queue.length) % app.queue.length;
    app.queueIndex = nextIndex;
    playFile(app.queue[nextIndex]);
  }
  function focusNearest(direction, rootDocument) {
    var doc = rootDocument || document;
    var selector = rootDocument ? 'button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])' : '[data-focusable]:not([hidden])';
    var items = Array.prototype.slice.call(doc.querySelectorAll(selector))
      .filter(function (item) { return item.getClientRects().length && !item.disabled; });
    if (!items.length) return;
    var active = doc.activeElement;
    if (items.indexOf(active) < 0) { items[0].focus(); return; }
    var current = active.getBoundingClientRect();
    var cx = current.left + current.width / 2;
    var cy = current.top + current.height / 2;
    var best = null;
    var bestScore = Infinity;
    items.forEach(function (item) {
      if (item === active) return;
      var rect = item.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var dx = x - cx;
      var dy = y - cy;
      var primary;
      var secondary;
      if (direction === 'left' && dx < -2) { primary = -dx; secondary = Math.abs(dy); }
      else if (direction === 'right' && dx > 2) { primary = dx; secondary = Math.abs(dy); }
      else if (direction === 'up' && dy < -2) { primary = -dy; secondary = Math.abs(dx); }
      else if (direction === 'down' && dy > 2) { primary = dy; secondary = Math.abs(dx); }
      else return;
      var score = primary + secondary * 1.7;
      if (score < bestScore) { bestScore = score; best = item; }
    });
    if (best) best.focus();
  }
  function onKey(event) {
    var key = event.key || '';
    var code = event.keyCode;
    var target = event.target;
    var tag = target && target.tagName ? target.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (target && target.isContentEditable)) {
      if (code === 10252 || key === 'MediaPlayPause') { event.preventDefault(); togglePlayback(); }
      else if (code === 10233 || key === 'MediaTrackNext') { event.preventDefault(); playQueueAt(app.queueIndex + 1); }
      else if (code === 10232 || key === 'MediaTrackPrevious') { event.preventDefault(); playQueueAt(app.queueIndex - 1); }
      else return;
      return;
    }
    if (key === 'ArrowLeft' || code === 37) { event.preventDefault(); focusNearest('left'); }
    else if (key === 'ArrowRight' || code === 39) { event.preventDefault(); focusNearest('right'); }
    else if (key === 'ArrowUp' || code === 38) { event.preventDefault(); focusNearest('up'); }
    else if (key === 'ArrowDown' || code === 40) { event.preventDefault(); focusNearest('down'); }
    else if (key === 'Backspace' || key === 'Escape' || code === 10009) {
      if (app.fullAppOpen) { event.preventDefault(); closeFullApp(); return; }
      if (app.folderStack.length) { event.preventDefault(); app.folderStack.pop(); readCurrentFolder(); }
      else if (app.view === 'stream') { event.preventDefault(); setView('usb'); }
      else if (window.tizen && tizen.application) { event.preventDefault(); tizen.application.getCurrentApplication().exit(); }
    } else if (code === 10252 || key === 'MediaPlayPause') { event.preventDefault(); togglePlayback(); }
    else if (code === 10233 || key === 'MediaTrackNext') { event.preventDefault(); playQueueAt(app.queueIndex + 1); }
    else if (code === 10232 || key === 'MediaTrackPrevious') { event.preventDefault(); playQueueAt(app.queueIndex - 1); }
  }
  function setView(name) {
    app.view = name;
    $('usb-view').hidden = name !== 'usb';
    $('stream-view').hidden = name !== 'stream';
    document.querySelectorAll('.tab').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-view') === name);
    });
  }
  function setUpRemote() {
    if (window.tizen && tizen.tvinputdevice) {
      try {
        tizen.tvinputdevice.registerKeyBatch(['MediaPlayPause', 'MediaTrackNext', 'MediaTrackPrevious']);
      } catch (ignore) { /* media key registration varies with the active TV firmware */ }
    }
    document.addEventListener('keydown', onKey, true);
  }
  function openFullApp() {
    app.fullAppOpen = true;
    $('full-app-view').hidden = false;
    $('full-app-button').textContent = 'Voltar ao player USB';
    try { $('full-app-frame').contentWindow.focus(); } catch (ignore) {}
  }
  function closeFullApp() {
    app.fullAppOpen = false;
    $('full-app-view').hidden = true;
    $('full-app-button').textContent = 'App completa';
    $('full-app-button').focus();
  }

  document.querySelectorAll('.tab').forEach(function (button) {
    button.addEventListener('click', function () { setView(button.getAttribute('data-view')); });
  });
  $('refresh-button').addEventListener('click', listStorages);
  $('full-app-button').addEventListener('click', function () {
    if (app.fullAppOpen) closeFullApp(); else openFullApp();
  });
  $('full-app-frame').addEventListener('load', function () {
    try {
      var frameDoc = $('full-app-frame').contentDocument;
      if (!frameDoc || frameDoc.title === 'LqMusic — app indisponível') {
        $('full-app-missing').hidden = false;
        return;
      }
      var focusStyle = frameDoc.createElement('style');
      focusStyle.textContent = ':focus-visible{outline:3px solid #d2b6ff!important;outline-offset:3px!important}';
      frameDoc.head.appendChild(focusStyle);
      frameDoc.addEventListener('keydown', function (event) {
        var target = event.target;
        var editing = target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
        if (event.key === 'Escape' || event.keyCode === 10009 || (event.key === 'Backspace' && !editing)) {
          event.preventDefault(); event.stopPropagation(); closeFullApp();
        } else if (!editing && /^Arrow(Left|Right|Up|Down)$/.test(event.key)) {
          event.preventDefault(); event.stopPropagation();
          focusNearest(event.key.slice(5).toLowerCase(), frameDoc);
        }
      }, true);
    } catch (ignore) { /* The TV keeps the USB player available if frame access is restricted. */ }
  });
  $('up-button').addEventListener('click', function () {
    if (app.folderStack.length) { app.folderStack.pop(); readCurrentFolder(); }
  });
  $('stream-play').addEventListener('click', playStream);
  $('play-pause').addEventListener('click', togglePlayback);
  $('next').addEventListener('click', function () { playQueueAt(app.queueIndex + 1); });
  $('previous').addEventListener('click', function () { playQueueAt(app.queueIndex - 1); });
  $('seek').addEventListener('change', function () {
    if (isFinite(audio.duration) && audio.duration > 0) audio.currentTime = (Number(this.value) / 1000) * audio.duration;
  });
  audio.addEventListener('timeupdate', function () {
    var duration = audio.duration;
    $('current-time').textContent = formatTime(audio.currentTime);
    $('duration').textContent = formatTime(duration);
    if (isFinite(duration) && duration > 0) $('seek').value = String(Math.round(audio.currentTime / duration * 1000));
  });
  audio.addEventListener('play', function () {
    $('play-pause').textContent = 'Ⅱ';
    $('play-pause').setAttribute('aria-label', 'Pausar');
  });
  audio.addEventListener('pause', function () {
    $('play-pause').textContent = '▶';
    $('play-pause').setAttribute('aria-label', 'Reproduzir');
  });
  audio.addEventListener('ended', function () { if (app.queueIndex >= 0) playQueueAt(app.queueIndex + 1); });
  audio.addEventListener('error', function () { setStatus('Falha na reprodução. Verifique o formato do áudio e se o USB/endereço continua disponível.'); });
  try { $('stream-url').value = localStorage.getItem('painho-tv-stream-url') || ''; } catch (ignore) {}
  setUpRemote();
  listStorages();
  setTimeout(function () {
    var first = document.querySelector('[data-focusable]:not([hidden])');
    if (first) first.focus();
  }, 500);
}());
