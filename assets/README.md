# assets

`Archivo-700-subset.ttf` is the face drawn into the Open Graph card
(`src/app/opengraph-image.tsx`). It is the same display face the site uses for
its headings, cut down to the characters the card actually shows.

Any character missing from it silently falls back to a different face, so when
the card's copy changes, rebuild the subset:

```sh
curl -sL -o "/tmp/Archivo[wdth,wght].ttf" \
  "https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth,wght%5D.ttf"
fonttools varLib.instancer /tmp/Archivo[wdth,wght].ttf wght=700 wdth=100 -o /tmp/frozen.ttf

pyftsubset /tmp/frozen.ttf \
  --text="use-right-click React hook for custom context menus with desktop right-click and mobile long-press support. kkweb.io" \
  --unicodes="U+0020-007E,U+00A0-00FF" \
  --output-file=assets/Archivo-700-subset.ttf \
  --no-hinting --desubroutinize --layout-features=''
```
