# Inverse Akshat Index

An independent financial satire dashboard. It charts hypothetical trades that took the other side of public investing calls by Akshat Shrivastava.

[Open the dashboard](https://whitewalker7.github.io/inverse-akshat-index/)

## Read the figures

Hindsight Select ranks each call by its strongest completed 30-day, 90-day or one-year gross return, then features the top three. Each headline belongs to a single trade. The archive contains all 50 scored calls, source links and the matched Nifty 50 ETF returns. Prices are in rupees and include currency moves where relevant.

## Run locally

Serve the repository root with `python3 -m http.server 8000` and open `http://localhost:8000`. The page runs directly from the HTML, CSS and JavaScript in this repository.

## Data and fonts

`data.js` contains the plotted observations. `call-archive.csv` contains the dated outcomes and links to the public statements and market data. The bundled fonts use the licenses in `dm-sans-license.txt` and `spectral-license.txt`.
