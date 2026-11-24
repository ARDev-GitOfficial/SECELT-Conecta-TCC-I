import { ArrowDownToLine, Globe, Smartphone } from 'lucide-react';

const apkFile = 'SECELT-Conecta-demo.apk';

export function DownloadPage() {
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
        <h2 id="install-title">Instalar ou atualizar</h2>
        <p>Abra o APK baixado no Android. Se o SECELT Conecta já estiver instalado, confirme a atualização.</p>
      </section>
      <section className="sg-download-panel sg-glass" aria-labelledby="connection-title">
        <Globe size={21} aria-hidden="true" />
        <h2 id="connection-title">Abrir o portal</h2>
        <p>Com internet, abra o aplicativo para ir direto ao Feed. O tema escolhido fica salvo no aparelho.</p>
      </section>
    </div>
  </div>;
}
