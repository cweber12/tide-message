# Weekly Tidepool Message — GitHub Pages

A tiny static GitHub Pages app that fetches NOAA CO-OPS high/low tide predictions for:

- San Diego, CA — station `9410170`
- La Jolla, CA — station `9410230`
- Mission Bay, CA — station `9410196`

It generates a copy-ready weekly group-chat message for homeschool tidepool outings.

## Deploy on GitHub Pages

1. Create a new GitHub repository, for example `tidepool-message`.
2. Upload `index.html` to the repository root.
3. In GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/root`, then save.
6. Open the GitHub Pages URL GitHub gives you.

## Adjusting the logic

Inside `index.html`, edit these constants if needed:

```js
const STATIONS = [
  { name: "San Diego", id: "9410170" },
  { name: "La Jolla", id: "9410230" },
  { name: "Mission Bay", id: "9410196" }
];
```

The page uses NOAA parameters:

- `product=predictions`
- `interval=hilo`
- `datum=MLLW`
- `time_zone=lst_ldt`
- `units=english`
- `format=json`

## Safety note

NOAA tide predictions are not surf, swell, lightning, water-quality, or access/safety forecasts. The generated message includes a reminder to check conditions before going.
