import { ArrowDownToLine, Settings, Smartphone } from 'lucide-react';

const apkFile = 'SECELT-Conecta-demo.apk';

export function DownloadPage() {
  const { hostname, origin } = window.location;
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);

  return <div className="sg-download-page">
    <section className="sg-download-card sg-glass" aria-labelledby="download-title">
      <img className="sg-download-logo" src="/assets/brand.svg" alt="" width="80" height="80" />
      <div className="sg-download-copy">
        <span><Smartphone size={15} aria-hidden="true" /> Android 7 ou superior</span>
        <h1 id="download-title">SECELT Conecta para Android</h1>
        <p>Acesse a agenda, os resultados esportivos e os pontos turísticos de São Miguel do Guamá no celular.</p>
      </div>
      <a className="sg-primary sg-download-button" href={`/downloads/${apkFile}`} download={apkFile}>
        <ArrowDownToLine size={19} aria-hidden="true" /> Baixar APK
      </a>
    </section>
    <div className="sg-download-instructions">
      <section className="sg-download-panel sg-glass" aria-labelledby="install-title">
        <Smartphone size={21} aria-hidden="true" />
        <h2 id="install-title">Instalar no celular</h2>
        <p>Abra o APK baixado no Android. Se o sistema solicitar, permita a instalação pelo navegador ou pelo gerenciador de arquivos.</p>
      </section>
      <section className="sg-download-panel sg-glass" aria-labelledby="connection-title">
        <Settings size={21} aria-hidden="true" />
        <h2 id="connection-title">Conectar ao portal</h2>
        {isLocal
          ? <p>No app, toque na engrenagem e informe o endereço do servidor acessível pelo celular.</p>
          : <>
            <p>No app, toque na engrenagem <strong>Configurar conexão</strong>, informe este endereço e toque em <strong>Salvar e reconectar</strong>.</p>
            <code>{origin}</code>
          </>}
      </section>
    </div>
  </div>;
}
