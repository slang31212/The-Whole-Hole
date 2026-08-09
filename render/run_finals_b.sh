set -e
R="python3 render_mpss.py --ss 2 --ao 24 --ao-stride 4"
# stale / never-finished
$R --scene series  --width 1920 --height 1080 --out ../images/mpss-hulls-in-series.jpg
$R --scene loading --width 1920 --height 1080 --out ../images/mpss-loading-begins.jpg
# scene 8 catalogue panels
for m in wind power carbon data; do
  $R --scene "mission:$m" --width 900 --height 700 --out "panel-$m.jpg"
done
python3 make_strip.py panel-wind.jpg panel-power.jpg panel-carbon.jpg panel-data.jpg \
    --out ../images/mpss-four-missions.jpg --gutter 6
# scene 6 mating triptych
for p in A B C; do
  $R --scene "mate:$p" --width 840 --height 1080 --out "panel-mate-$p.jpg"
done
python3 make_strip.py panel-mate-A.jpg panel-mate-B.jpg panel-mate-C.jpg \
    --out ../images/mpss-wet-mating.jpg --gutter 6
# re-render the three approved plates for the reference turbine
$R --scene erect   --width 1920 --height 1080 --out ../images/mpss-turbine-erection.jpg
$R --scene station --width 1920 --height 1080 --out ../images/mpss-on-station.jpg
$R --scene quay    --width 1600 --height 2000 --out ../images/mpss-deck-loadout.jpg
echo ALLDONE
