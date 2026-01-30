const measurementMeta = document.querySelector('meta[name="ga-measurement-id"]');
const measurementId = measurementMeta?.content?.trim();

if (measurementId && measurementId !== 'GA_MEASUREMENT_ID') {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId);
}
