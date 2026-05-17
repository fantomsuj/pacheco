# Pacheco Ventures

Static landing page for Pacheco Ventures, built with Vite.

## Project Structure

```text
.
├── index.html
├── public/
│   ├── favicon.svg
│   └── images/
├── src/
│   ├── js/
│   │   ├── analytics.js
│   │   └── main.js
│   └── styles/
│       └── style.css
└── docs/
    └── archive/
        └── newindex.html
```

## Development

```sh
npm install
npm run dev
```

## Production Build

```sh
npm run build
npm run preview
```

The active site entry point is `index.html`. Static files that need stable URL paths live in `public/`, while source CSS and JavaScript live under `src/`.
