set -e
cd /home/user/The-Whole-Hole/render
for p in A B; do
  python3 render_mpss.py --scene "mate:$p" --width 840 --height 1080 \
      --ss 2 --ao 24 --ao-stride 4 --out "panel-mate-$p.jpg"
done
python3 make_strip.py panel-mate-A.jpg panel-mate-B.jpg panel-mate-C.jpg \
    --out ../images/mpss-wet-mating.jpg --gutter 6
echo MATEDONE
