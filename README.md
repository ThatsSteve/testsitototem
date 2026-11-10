# Totem Automobili — sito statico

Sito in HTML, CSS e JavaScript puro: nessun framework, nessuna dipendenza, nessun cookie, nessuna chiamata a servizi esterni. Tutto quello che serve (font, foto, video, brochure) è in questa cartella.

## Vederlo in locale

Da questa cartella:

```bash
python -m http.server 8080
```

poi apri http://localhost:8080. Aprire i file `.html` con doppio clic funziona solo in parte: video e gallerie richiedono un server.

## Pubblicarlo

Va caricata la cartella così com'è, senza passaggi di build, su qualsiasi hosting statico.

- **Netlify / Cloudflare Pages**: cartella di pubblicazione = radice del repository. Il file `_headers` imposta da solo intestazioni di sicurezza (CSP, HSTS, nosniff, frame-ancestors) e cache lunga per foto, video e font.
- **GitHub Pages**: Settings → Pages → branch `main`, cartella `/ (root)`. `_headers` viene ignorato. La stessa politica di sicurezza (CSP) è comunque scritta in ogni pagina con un `<meta>`. `.nojekyll` evita che GitHub rielabori i file.
- **Apache / Nginx / altri**: copiare in configurazione i valori di `_headers` e impostare `404.html` come pagina di errore.

Servire sempre in HTTPS.

## Prima che diventi il sito ufficiale

- **Indicizzazione**: oggi i motori di ricerca sono tenuti fuori, così una copia non ufficiale non compete con totemautomobili.com. Per aprirla:
  - in ogni pagina togliere `<meta name="robots" content="noindex, nofollow">`;
  - in `_headers` togliere la riga `X-Robots-Tag`;
  - in `robots.txt` sostituire `Disallow: /` con `Allow: /`.
- **Pagine legali** (`privacy.html`, `cookies.html`, `legal.html`, `accessibility.html`): sono bozze. I campi tratteggiati (REA, PEC, capitale sociale, foro competente, tempi di conservazione…) vanno completati e il testo va rivisto da un legale.
- **Collegamenti modificabili** in `assets/js/config.js`:
  - URL dei configuratori;
  - e-mail di contatto;
  - `formEndpoint`, per ricevere il modulo contatti da un servizio di form invece che dall'app di posta del visitatore. Se lo si usa, la sua origine va aggiunta a `connect-src` nella CSP, sia in `_headers` sia nel `<meta>` delle pagine.
- **Consumi ed emissioni**: verificare gli obblighi di pubblicazione per il mercato di destinazione.

## Video e connessioni lente

Ogni film ha due versioni: quella piena in Full HD e una `-lite`, che la pagina sceglie da sola quando la connessione misurata è sotto 5 Mbit/s. Con risparmio dati o rete 2G/3G resta il fotogramma fisso finché non si tocca Play. I video non contengono audio né metadati.

## Struttura

```
*.html                   Pagine (generate, ma modificabili a mano)
assets/css/              main.css (base), v2.css (componenti), print.css (stampa)
assets/js/               main.js, v2.js, intro.js, config.js (collegamenti modificabili)
assets/img/              Foto WebP in più tagli (480–2000 px); il browser scarica solo quello adatto
assets/img/gal/<auto>/   Gallerie delle commissioni (480 / 1100 / 1920 px)
assets/img/studio/       Render dello studio: 14 colori × 6 viste (960 / 1422 / 2844 px)
assets/video/            Video MP4 con fotogramma di anteprima, caricati solo quando entrano nello schermo
assets/brochures/        Brochure PDF 2026
_headers                 Intestazioni di sicurezza e cache (Netlify / Cloudflare Pages)
```

Totem Automobili Srl is not sponsored, associated, approved, endorsed nor, in any way, affiliated with Alfa Romeo & Stellantis SPA.
