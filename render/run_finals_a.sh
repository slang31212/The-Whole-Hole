set -e
for s in series:mpss-hulls-in-series deckbox:mpss-deck-on-quay loading:mpss-loading-begins; do
  name="${s%%:*}"; out="${s##*:}"
  python3 render_mpss.py --scene "$name" --width 1920 --height 1080 \
      --ss 2 --ao 24 --ao-stride 4 --out "../images/$out.jpg"
done
