export function loadVLibras() {
  if (document.querySelector('script[data-vlibras]')) return;
  
  const script = document.createElement('script');
  script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  script.async = true;
  script.defer = true;
  script.dataset.vlibras = 'true';
  
  script.onload = () => {
    // @ts-ignore
    if (window.VLibras?.Widget) {
      // @ts-ignore
      new window.VLibras.Widget('https://vlibras.gov.br/app');
    }
  };
  
  document.body.appendChild(script);
}
