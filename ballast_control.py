"""Ballast / stability control program for a four-column semi-submersible.

Translated from a 1980s BASIC listing (BASIC + GSX graphics driver, CHR$(27)
escape codes, machine-code CALLs). The original modelled a rectangular
pontoon ring with four corner columns joined by a bracing box: a 12x12x7
grid of pontoon/column ballast tanks plus an 8x8 grid for the bracing box,
tank "mass" (really a normalised steel volume) derived from user-entered
plate/bulkhead thickness, and front/side/plan wireframe views drawn on a
period graphics card.

The OCR'd source was corrupted in many places (curly quotes, misread
digits/operators, truncated lines, garbled loop bounds). Where intent was
ambiguous this port makes the physically sensible choice:
  - tank ballast state is stored as a flag rather than the original's
    "multiply the type code by 100" trick,
  - the four-fold ballast mirroring is treated as 90/180/270 degree
    rotational symmetry of the grid (consistent with a symmetric
    four-column hull),
  - the GSX/CHR$(27) drawing calls are replaced with a matplotlib
    front/side/plan plot of the tank layout.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

GRID = 12          # main tank grid extent (rows/columns), indices 1..GRID
LEVELS = 7          # height levels of the main grid, indices 1..LEVELS
COL_GRID = 8        # secondary column/bracing grid extent, indices 1..COL_GRID
CELL = 7.5          # metres per main-grid cell
STEEL_DENSITY = 7.86  # t/m3, used to convert normalised volume to tonnes

# local centre-of-gravity offset (dx, dy, dz) in metres for each of the 11 tank types
CG_OFFSETS = {
    1: (3.750, 3.750, 3.750),
    2: (3.750, 3.750, 3.750),
    3: (3.750, 3.750, 1.875),
    4: (3.750, 7.500, 1.875),
    5: (3.750, 3.750, 1.875),
    6: (3.750, 3.750, 1.875),
    7: (7.500, 7.500, 1.875),
    8: (3.750, 7.500, 1.875),
    9: (3.750, 3.750, 3.750),
    10: (7.500, 3.750, 1.875),
    11: (7.500, 3.750, 1.875),
}


@dataclass
class StabilityResult:
    cg: tuple[float, float, float]
    inertia: tuple[float, float, float]
    steel_tonnage: float
    displacement: float
    pontoon_ballast: float
    column_ballast: float
    draft: float
    mooring_force: float
    metacentric_height: float
    centre_of_buoyancy: float

    def report(self) -> str:
        x, y, z = self.cg
        ix, iy, iz = self.inertia
        lines = [
            f"{'X':>18}{'Y':>18}{'Z':>18}",
            f"C.G.    = {x:14.3f}{y:18.3f}{z:18.3f}",
            f"Inertia = {ix:14,.2f}{iy:18,.2f}{iz:18,.2f}",
            "",
            f"Steel tonnage        = {self.steel_tonnage:10.2f} tonnes",
            f"Vessel displacement  = {self.displacement:10.2f} tonnes",
            f"Pontoon ballast      = {self.pontoon_ballast:10.2f} tonnes",
            f"Column ballast       = {self.column_ballast:10.2f} tonnes",
            f"Operating draft      = {self.draft:10.2f} metres",
            f"Mooring force        = {self.mooring_force:10.2f} tonnes",
            f"Metacentric height   = {self.metacentric_height:10.2f} metres",
            f"Centre of buoyancy   = {self.centre_of_buoyancy:10.2f} metres",
        ]
        return "\n".join(lines)


class BallastControl:
    def __init__(self) -> None:
        self.tank: dict[tuple[int, int, int], int] = {}
        self.ballast_state: dict[tuple[int, int, int], bool] = {}
        self.col: dict[tuple[int, int], int] = {}
        self.mass: dict[int, float] = {}
        self.loads: list[tuple[float, float, float, float]] = []
        self.mooring_angle = 30.0
        self.mooring_tonnage = 150.0
        self.mooring_in_cg = False
        self._build_tank_layout()
        self._build_column_layout()

    # ------------------------------------------------------------------
    # Layout setup
    # ------------------------------------------------------------------
    def _build_tank_layout(self) -> None:
        t = self.tank
        edge = [1, 2, GRID - 1, GRID]

        # Pontoon ring, level 1
        for n in range(3, GRID - 1):
            for m in edge:
                t[(n, m, 1)] = 2
                t[(m, n, 1)] = 2

        corners = [(1, 1), (GRID, 1), (1, GRID), (GRID, GRID)]
        for n, m in corners:
            t[(n, m, 1)] = 2

        near_corners = [
            (2, 1), (GRID - 1, 1), (1, 2), (GRID, 2),
            (1, GRID - 1), (GRID, GRID - 1), (2, GRID), (GRID - 1, GRID),
        ]
        for n, m in near_corners:
            t[(n, m, 1)] = 1

        inner_corners = [(2, 2), (GRID - 1, 2), (2, GRID - 1), (GRID - 1, GRID - 1)]
        for n, m in inner_corners:
            t[(n, m, 1)] = 9

        # Four corner columns, levels 2..LEVELS-1 (2x2 footprint each corner)
        for o in range(2, LEVELS):
            for n in edge:
                for m in edge:
                    t[(n, m, o)] = 1

    def _build_column_layout(self) -> None:
        c = self.col
        corners = [(1, 1), (COL_GRID, 1), (1, COL_GRID), (COL_GRID, COL_GRID)]
        for n, m in corners:
            c[(n, m)] = 5

        near_corners = [
            (2, 1), (COL_GRID - 1, 1), (1, 2), (1, COL_GRID - 1),
            (2, COL_GRID), (COL_GRID - 1, COL_GRID), (COL_GRID, COL_GRID - 1), (COL_GRID, 2),
        ]
        for n, m in near_corners:
            c[(n, m)] = 6

        inner_corners = [(2, 2), (COL_GRID - 1, 2), (2, COL_GRID - 1), (COL_GRID - 1, COL_GRID - 1)]
        for n, m in inner_corners:
            c[(n, m)] = 3

        for n in range(3, COL_GRID - 1):
            c[(1, n)] = 10
            c[(n, 1)] = 4
            c[(COL_GRID, n)] = 10
            c[(n, COL_GRID)] = 4
            c[(2, n)] = 11
            c[(n, 2)] = 8
            c[(COL_GRID - 1, n)] = 11
            c[(n, COL_GRID - 1)] = 8
            for m in range(3, COL_GRID - 1):
                c[(n, m)] = 7

    # ------------------------------------------------------------------
    # Configuration
    # ------------------------------------------------------------------
    def set_plate_thickness(self, outer_mm: float, bulkhead_mm: float) -> None:
        ou = 56.25 * (outer_mm / 1000) + 0.05184
        bu = 28.125 * (bulkhead_mm / 1000) + 0.02592
        self.mass = {
            1: 2 * ou + 4 * bu + 0.378,
            2: 3 * ou + 3 * bu + 0.378,
            3: ou + 3 * bu + 0.378,
            4: 5 * ou + 2 * bu + 0.4725,
            5: 2 * ou + 2 * bu + 0.2835,
            6: 1.5 * ou + 2.5 * bu + 0.2835,
            7: 8 * ou + 4 * bu + 0.4725,
            8: 4 * ou + 3 * bu + 0.4725,
            9: ou + 5 * bu + 0.378,
        }
        self.mass[10] = self.mass[4]
        self.mass[11] = self.mass[8]

    # ------------------------------------------------------------------
    # Ballasting
    # ------------------------------------------------------------------
    def toggle_ballast(
        self,
        r1: int, r2: int, c1: int, c2: int, h1: int, h2: int,
        mirror: bool = False,
    ) -> tuple[int, int]:
        """Ballast/unballast every tank in the given range. Raises ValueError
        if the range covers a cell with no tank. If mirror is set, the same
        toggle is applied to the other three quadrants (90/180/270 degree
        rotational symmetry of the hull)."""
        regions = [(r1, r2, c1, c2)]
        if mirror:
            reflect = lambda i: GRID + 1 - i
            regions.append((reflect(r2), reflect(r1), reflect(c2), reflect(c1)))
            regions.append((reflect(c2), reflect(c1), r1, r2))
            regions.append((c1, c2, reflect(r2), reflect(r1)))

        touched: list[tuple[int, int, int]] = []
        for rr1, rr2, cc1, cc2 in regions:
            for n in range(rr1, rr2 + 1):
                for m in range(cc1, cc2 + 1):
                    for o in range(h1, h2 + 1):
                        key = (n, m, o)
                        if self.tank.get(key, 0) == 0:
                            raise ValueError(f"No tank at coordinates ({n}, {m}, {o})")
                        touched.append(key)

        ballasted = unballasted = 0
        for key in touched:
            if self.ballast_state.get(key, False):
                self.ballast_state[key] = False
                unballasted += 1
            else:
                self.ballast_state[key] = True
                ballasted += 1
        return ballasted, unballasted

    def add_load(self, x: float, y: float, z: float, weight_tonnes: float) -> None:
        self.loads.append((x, y, z, weight_tonnes))

    # ------------------------------------------------------------------
    # Stability calculation
    # ------------------------------------------------------------------
    def calculate(self) -> StabilityResult:
        sigmax = sigmay = sigmaz = 0.0
        inx = iny = inz = 0.0
        tm = 0.0
        pontoon_ballast_vol = 0.0
        column_ballast_vol = 0.0
        water_weight = 421.875 / STEEL_DENSITY

        for x, y, z, we in self.loads:
            wn = we / STEEL_DENSITY
            sigmax += wn * x; inx += wn * x * x
            sigmay += wn * y; iny += wn * y * y
            sigmaz += wn * z; inz += wn * z * z
            tm += wn

        if self.mooring_in_cg:
            we = (self.mooring_tonnage * self.mooring_angle) / 45
            wn = we / STEEL_DENSITY
            x, y, z = 45.0, 45.0, 0.0
            sigmax += wn * x; inx += wn * x * x
            sigmay += wn * y; iny += wn * y * y
            sigmaz += wn * z; inz += wn * z * z
            tm += wn

        for (n, m, o), type_code in self.tank.items():
            vol = self.mass[type_code]
            if self.ballast_state.get((n, m, o), False):
                vol1 = vol
                if o == 1:
                    vol += water_weight
                elif n in (1, GRID) and m == GRID:
                    vol += water_weight * 0.75
                else:
                    vol += water_weight / 2
                added = vol - vol1
                if o == 1:
                    pontoon_ballast_vol += added
                else:
                    column_ballast_vol += added

            cgx, cgy, cgz = CG_OFFSETS[type_code]
            disx = n * CELL - cgx
            disy = m * CELL - cgy
            disz = o * CELL - cgz
            sigmax += vol * disx; inx += vol * disx * disx
            sigmay += vol * disy; iny += vol * disy * disy
            sigmaz += vol * disz; inz += vol * disz * disz
            tm += vol

        def bracing_pos(i: int) -> float:
            if i <= 2:
                return i * CELL
            if i <= COL_GRID - 2:
                return 15 + (i - 2) * 15
            return 75 + (i - (COL_GRID - 2)) * CELL

        for (n, m), type_code in self.col.items():
            vol = self.mass[type_code]
            cgx, cgy, _ = CG_OFFSETS[type_code]
            disx = bracing_pos(m) - cgx
            disy = bracing_pos(n) - cgy
            disz = 46.875
            sigmax += vol * disx; inx += vol * disx * disx
            sigmay += vol * disy; iny += vol * disy * disy
            sigmaz += vol * disz; inz += vol * disz * disz
            tm += vol

        cg = (sigmax / tm, sigmay / tm, sigmaz / tm)

        steel = (tm - pontoon_ballast_vol - column_ballast_vol) * STEEL_DENSITY
        for _, _, _, we in self.loads:
            steel -= we

        displacement = tm * STEEL_DENSITY
        pontoon_ballast = pontoon_ballast_vol * STEEL_DENSITY
        column_ballast = column_ballast_vol * STEEL_DENSITY

        draft = displacement / 900 - 30
        if draft < 0:
            draft = displacement / 4500

        mooring_force = 8 * self.mooring_tonnage * math.sin(math.radians(self.mooring_angle))

        if draft < 7.5:
            cob = draft / 2
        else:
            cob = (126562.5 + 900 * (draft - 7.5) * 0.5 * (draft + 7.5)) / (
                33750 + 900 * (draft - 7.5)
            )

        mh = (39475 / (30 * draft + 450)) - (sigmaz / tm - cob)

        return StabilityResult(
            cg=cg,
            inertia=(inx, iny, inz),
            steel_tonnage=steel,
            displacement=displacement,
            pontoon_ballast=pontoon_ballast,
            column_ballast=column_ballast,
            draft=draft,
            mooring_force=mooring_force,
            metacentric_height=mh,
            centre_of_buoyancy=cob,
        )

    # ------------------------------------------------------------------
    # Plotting (replaces the original's GSX front/side/plan wireframe views)
    # ------------------------------------------------------------------
    def plot_views(self, filename: str = "tank_layout.png") -> str:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np

        # front: column (m) vs height (o); side: row (n) vs height (o); plan: row (n) vs column (m)
        front = np.zeros((LEVELS, GRID))
        side = np.zeros((LEVELS, GRID))
        plan = np.zeros((GRID, GRID))

        for (n, m, o), type_code in self.tank.items():
            state = 2 if self.ballast_state.get((n, m, o), False) else 1
            front[o - 1, m - 1] = max(front[o - 1, m - 1], state)
            side[o - 1, n - 1] = max(side[o - 1, n - 1], state)
            plan[n - 1, m - 1] = max(plan[n - 1, m - 1], state)

        cmap = matplotlib.colors.ListedColormap(["white", "seagreen", "steelblue"])
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        for ax, data, title in zip(
            axes, [front, side, plan], ["Front View", "Side View", "Plan View"]
        ):
            ax.imshow(data, cmap=cmap, vmin=0, vmax=2, origin="lower", aspect="auto")
            ax.set_title(title)
            ax.set_xticks([])
            ax.set_yticks([])
        fig.suptitle("Tank layout (green = empty, blue = ballasted)")
        fig.savefig(filename, dpi=150, bbox_inches="tight")
        plt.close(fig)
        return filename


# ----------------------------------------------------------------------
# Interactive CLI, mirroring the original program's prompts
# ----------------------------------------------------------------------
def _ask_float(prompt: str, default: float | None = None) -> float:
    raw = input(prompt).strip()
    if raw == "" and default is not None:
        return default
    return float(raw)


def _ask_yes_no(prompt: str) -> bool:
    return input(prompt).strip().lower().startswith("y")


def main() -> None:
    control = BallastControl()

    outer = _ask_float("Enter outer plate thickness (mm): ")
    bulkhead = _ask_float("Enter bulkhead thickness (mm): ")
    control.set_plate_thickness(outer, bulkhead)

    while True:
        while _ask_yes_no("Any extra tanks to be ballasted? (y/n): "):
            r1 = int(_ask_float("Start row: "))
            r2 = int(_ask_float("End row: "))
            c1 = int(_ask_float("Start column: "))
            c2 = int(_ask_float("End column: "))
            h1 = int(_ask_float("Start height: "))
            h2 = int(_ask_float("End height: "))
            if not _ask_yes_no("Correct (y/n): "):
                continue
            mirror = _ask_yes_no("Ballast three other sides the same (y/n): ")
            try:
                ballasted, unballasted = control.toggle_ballast(r1, r2, c1, c2, h1, h2, mirror)
                print(f"{ballasted} tanks ballasted")
                print(f"{unballasted} tanks unballasted")
            except ValueError as exc:
                print(f"ERROR - {exc}")

        while _ask_yes_no("Any extra weights to be included? (y/n): "):
            x = _ask_float("X-coordinate: ")
            y = _ask_float("Y-coordinate: ")
            z = _ask_float("Z-coordinate: ")
            we = _ask_float("Weight (tonnes): ")
            if _ask_yes_no("Correct (y/n): "):
                control.add_load(x, y, z, we)
            if len(control.loads) >= 10:
                break

        print("MOORING FORCES (return for default)")
        ang = _ask_float("Enter angle in degrees (30): ", default=0.0)
        ton = _ask_float("Tonnage on chains (150 tonnes): ", default=0.0)
        control.mooring_angle = ang if ang else 30.0
        control.mooring_tonnage = ton if ton else 150.0
        control.mooring_in_cg = _ask_yes_no("Mooring forces included in c.g. (y/n): ")

        result = control.calculate()
        print()
        print(result.report())
        print()

        if _ask_yes_no("Plot front/side/plan views (y/n): "):
            path = control.plot_views()
            print(f"Saved plot to {path}")

        if _ask_yes_no("Finish (y/n): "):
            break


if __name__ == "__main__":
    main()
