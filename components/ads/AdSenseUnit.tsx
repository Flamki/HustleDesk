import React, { useEffect } from 'react';

type AdSenseUnitProps = {
  slot: string;
  label: string;
  className?: string;
  format?: 'auto' | 'fluid';
  layoutKey?: string;
  fullWidthResponsive?: boolean;
};

const defaultClientId = 'ca-pub-3346233528948536';
const clientId = (import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || defaultClientId).trim();
const testMode = (import.meta.env.VITE_GOOGLE_ADSENSE_TEST_MODE || '').trim().toLowerCase() === 'true';
const scriptId = 'google-adsense-script';
const scriptSrc = clientId
  ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`
  : '';

export const hasAdSenseClient = Boolean(clientId);
export const adSenseAccountId = clientId;
export const adSenseScriptId = scriptId;
export const adSenseScriptSrc = scriptSrc;

const loadAdSenseScript = () => {
  if (typeof document === 'undefined' || !clientId) {
    return null;
  }

  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    return existingScript;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = scriptSrc;
  document.head.appendChild(script);

  return script;
};

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slot,
  label,
  className = '',
  format = 'auto',
  layoutKey,
  fullWidthResponsive = true,
}) => {
  const adSlot = slot.trim();
  const canRenderAd = Boolean(clientId && adSlot);

  useEffect(() => {
    if (!canRenderAd || typeof window === 'undefined') {
      return;
    }

    const script = loadAdSenseScript();
    const requestAd = () => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Google AdSense request was skipped.', error);
        }
      }
    };

    if (!script) {
      return;
    }

    if (script.dataset.loaded === 'true') {
      requestAd();
      return;
    }

    const handleLoad = () => {
      script.dataset.loaded = 'true';
      requestAd();
    };

    script.addEventListener('load', handleLoad, { once: true });
    return () => script.removeEventListener('load', handleLoad);
  }, [adSlot, canRenderAd, format, layoutKey]);

  if (!canRenderAd) {
    return null;
  }

  return (
    <div className={`adsense-unit ${className}`} aria-label={`${label} advertisement`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive={String(fullWidthResponsive)}
        data-adtest={testMode ? 'on' : undefined}
      />
    </div>
  );
};

export default AdSenseUnit;
