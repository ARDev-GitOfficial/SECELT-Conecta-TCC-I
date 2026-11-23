import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { handleRequest } from './server/handler.js';

export { handleRequest };

if (import.meta.main) {
  const openPreview = process.platform === 'win32' && process.argv.includes('--abrir');
  const port = openPreview ? 0 : Number(process.env.PORT || 4173);
  const appServer = createServer(handleRequest);
  appServer.listen(port, openPreview ? '127.0.0.1' : '0.0.0.0', () => {
    const address = `http://localhost:${appServer.address().port}`;
    console.log(`SECELT Conecta API em ${address}`);
    if (openPreview) {
      const browser = spawn('explorer.exe', [address], {windowsHide:true, stdio:'ignore'});
      browser.on('error', () => console.log('Abra o endereço acima no navegador.'));
      browser.unref();
    }
  });
}
