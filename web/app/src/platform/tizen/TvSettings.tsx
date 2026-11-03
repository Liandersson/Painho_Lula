import { Check, Heart, Headphones, Monitor, Music2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Select } from '@/components/Select';
import { usePlayer } from '@/state/player';
import { useTvPreferences, TOPICS, type AudioMode } from './preferences';

export default function TvSettings() {
  const prefs = useTvPreferences();
  const autoplay = usePlayer((s) => s.autoplay);
  const stats = usePlayer((s) => s.nowPlaying?.stream);
  const [restored, setRestored] = useState(false);
  return (
    <div className="tv-settings-page" data-tv-settings>
      <PageHeader title="Do seu jeito" />
      <p className="tv-home-note">Ajustes para sua TV, seu controle e sua música.</p>
      <section className="tv-settings-section">
        <h2>
          <Music2 size={26} />
          Seus temas
        </h2>
        <p>Escolha o que aparece no topo da Home. Seus artistas mais ouvidos também ganham espaço automaticamente.</p>
        <div className="tv-settings-topics">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              className="tv-topic"
              aria-pressed={prefs.topics.includes(t.id)}
              onClick={() => prefs.toggleTopic(t.id)}
            >
              {prefs.topics.includes(t.id) && <Check size={18} />}
              {t.label}
            </button>
          ))}
        </div>
      </section>
      <section className="tv-settings-section">
        <h2>
          <Headphones size={26} />
          Som e reprodução
        </h2>
        <div className="tv-setting-row">
          <div>
            <strong>Qualidade do áudio</strong>
            <p>A mudança vale a partir da próxima música.</p>
          </div>
          <Select<AudioMode>
            label="Qualidade do áudio"
            value={prefs.audioMode}
            options={[
              { value: 'quality', label: 'Melhor disponível' },
              { value: 'compatible', label: 'Compatibilidade · AAC' },
              { value: 'data', label: 'Economia de dados' },
            ]}
            onChange={prefs.setAudioMode}
          />
        </div>
        <p>
          “Melhor disponível” usa a maior qualidade oferecida no codec suportado. AAC prioriza compatibilidade. A
          qualidade final depende da fonte e da saída de som da TV.
        </p>
        {stats && (
          <p className="tv-audio-detail" role="status">
            Tocando: {stats.codec ?? 'áudio'}
            {stats.bitrateKbps ? ` · ${stats.bitrateKbps} kbps` : ''}
            {stats.sampleRateHz ? ` · ${Math.round(stats.sampleRateHz / 100) / 10} kHz` : ''}
            {stats.channels ? ` · ${stats.channels} canais` : ''}
          </p>
        )}
        <label className="tv-setting-row">
          <div>
            <strong>Equilibrar volume entre faixas</strong>
            <p>Suaviza músicas mais altas, sem amplificar as mais baixas.</p>
          </div>
          <input
            type="checkbox"
            checked={prefs.leveling}
            onChange={(event) => prefs.setLeveling(event.target.checked)}
          />
        </label>
        <label className="tv-setting-row">
          <div>
            <strong>Continuar tocando</strong>
            <p>Busca músicas relacionadas ao terminar a fila.</p>
          </div>
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(event) => usePlayer.getState().setAutoplay(event.target.checked)}
          />
        </label>
      </section>
      <section className="tv-settings-section">
        <h2>
          <Monitor size={26} />
          Tela e navegação
        </h2>
        <label className="tv-setting-row">
          <div>
            <strong>Texto ampliado</strong>
            <p>Mais conforto para ler de longe.</p>
          </div>
          <input
            type="checkbox"
            checked={prefs.largeText}
            onChange={(event) => prefs.setLargeText(event.target.checked)}
          />
        </label>
        <label className="tv-setting-row">
          <div>
            <strong>Descobertas na Home</strong>
            <p>Recomendações e coleções online junto às suas músicas.</p>
          </div>
          <input
            type="checkbox"
            checked={prefs.discovery}
            onChange={(event) => prefs.setDiscovery(event.target.checked)}
          />
        </label>
        <p>
          Setas movem o foco. OK escolhe. Voltar retorna. O cursor funciona junto com o controle; clique em uma música
          para tocar.
        </p>
      </section>
      <section className="tv-settings-section">
        <h2>
          <Heart size={26} />
          Seu gosto fica aqui
        </h2>
        <p>
          {prefs.favorites.length} favoritas salvas nesta TV. O histórico e suas favoritas personalizam as recomendações
          sem exigir login.
        </p>
        <p>
          As buscas e as músicas usadas para obter recomendações são enviadas ao serviço de música. Suas preferências
          ficam no armazenamento local da TV.
        </p>
        <button
          className="tv-secondary-action"
          disabled={!prefs.hidden.length}
          onClick={() => {
            prefs.restoreHidden();
            setRestored(true);
          }}
        >
          <RotateCcw size={19} />
          Reexibir músicas ocultadas ({prefs.hidden.length})
        </button>
        {restored && <p role="status">As músicas ocultadas podem voltar às recomendações.</p>}
      </section>
      <footer className="tv-home-footer">LqMusic 1.4.0 · Samsung Tizen 9.0+ · Interface otimizada para TV</footer>
    </div>
  );
}
