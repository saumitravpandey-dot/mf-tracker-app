#!/usr/bin/env python3
"""
Fetch live NAV data from mfapi.in and compute the exact Sample Portfolio
holdings + redemptions. Outputs lib/sampleData.ts into the Next.js project.

Run from the mf-tracker-app directory:
    python scripts/gen_sample_data.py
"""

import json, time, sys, requests
from datetime import date, datetime, timedelta
from pathlib import Path

SLEEP   = 0.35
SIP_DAY = 10

FUNDS = [
    (120716, "UTI Nifty 50 Index Fund - Direct Plan - Growth",                          1500, "2021-06-10"),
    (118825, "Mirae Asset Large Cap Fund - Direct Plan - Growth",                        1000, "2021-06-10"),
    (118632, "Nippon India Large Cap Fund - Direct Plan Growth Plan - Growth Option",     750,  "2021-09-10"),
    (122639, "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",                       1500, "2021-06-10"),
    (120166, "Kotak Flexicap Fund - Growth - Direct",                                    750,  "2021-09-10"),
    (118955, "HDFC Flexi Cap Fund - Growth Option - Direct Plan",                        500,  "2022-03-10"),
    (119071, "DSP Midcap Fund - Direct Plan - Growth",                                   1000, "2021-06-10"),
    (120403, "Invesco India Midcap Fund - Direct Plan - Growth Option",                  750,  "2021-12-10"),
    (125354, "Axis Small Cap Fund - Direct Plan - Growth",                               1000, "2021-06-10"),
    (118778, "Nippon India Small Cap Fund - Direct Plan Growth Plan - Growth Option",     750,  "2021-11-10"),
    (146513, "Nippon India Nifty Next 50 Junior BeES FoF - Direct Plan - Growth",        750,  "2022-01-10"),
    (134813, "Mirae Asset Aggressive Hybrid Fund - Direct Plan - Growth",                1000, "2021-06-10"),
    (131373, "Kotak Equity Savings Fund - Direct - Growth",                              750,  "2021-08-10"),
    (145552, "Motilal Oswal Nasdaq 100 Fund of Fund - Direct Plan Growth",               500,  "2021-06-10"),
    (140243, "Edelweiss Greater China Equity Off-shore Fund - Direct Plan - Growth",     250,  "2021-06-10"),
    (120594, "ICICI Prudential Technology Fund - Direct Plan - Growth",                  500,  "2021-06-10"),
    (120503, "Axis ELSS Tax Saver Fund - Direct Plan - Growth Option",                   1000, "2021-06-10"),
    (120692, "ICICI Prudential Corporate Bond Fund - Direct Plan - Growth",              1000, "2021-06-10"),
]

LUMP_SUMS = [
    (134813, 15000, "2021-10-15", "Lump sum — top-up Mirae Hybrid"),
    (120503, 25000, "2022-01-14", "Lump sum — ELSS FY22 tax saving"),
    (118955, 20000, "2022-05-16", "Lump sum — HDFC Flexi Cap dip buy"),
    (120716, 25000, "2022-06-17", "Lump sum — UTI Nifty 50 dip buy"),
    (122639, 30000, "2022-06-22", "Lump sum — PPFAS dip buy"),
    (125354, 12000, "2022-07-08", "Lump sum — Axis Small Cap dip buy"),
    (120692, 30000, "2023-01-12", "Lump sum — Corp Bond high-rate window"),
    (122639, 25000, "2023-06-19", "Lump sum — PPFAS top-up"),
    (120503, 25000, "2024-03-14", "Lump sum — ELSS FY24 tax saving"),
    (120716, 20000, "2024-10-09", "Lump sum — UTI Nifty 50 top-up"),
]

REDEMPTION_PLAN = [
    (120594, "ICICI Prudential Technology Fund - Direct Plan - Growth",               0.30, "2022-01-28", "Partial exit — tech sector correction"),
    (140243, "Edelweiss Greater China Equity Off-shore Fund - Direct Plan - Growth",  0.55, "2022-12-14", "Partial exit — China underperformance"),
    (125354, "Axis Small Cap Fund - Direct Plan - Growth",                            0.40, "2023-08-11", "Partial profit booking — smallcap peak"),
    (131373, "Kotak Equity Savings Fund - Direct - Growth",                           0.35, "2024-12-13", "Partial rebalance — reduced conservative hybrid"),
]

def fetch_nav_map(code):
    url  = f"https://api.mfapi.in/mf/{code}"
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    out  = {}
    for d in resp.json()["data"]:
        try:
            out[datetime.strptime(d["date"], "%d-%m-%Y").date()] = float(d["nav"])
        except Exception:
            pass
    return out

def nav_on(nav_map, d):
    if isinstance(d, str):
        d = datetime.strptime(d, "%Y-%m-%d").date()
    for _ in range(10):          # walk back up to 10 calendar days for holidays
        if d in nav_map:
            return nav_map[d]
        d -= timedelta(days=1)
    return None

def sip_dates(start_str):
    start = datetime.strptime(start_str, "%Y-%m-%d").date()
    d     = start.replace(day=SIP_DAY)
    # advance to first SIP that is >= start
    while d < start:
        # add one month manually
        m = d.month + 1
        y = d.year + (m > 12)
        m = m if m <= 12 else m - 12
        d = d.replace(year=y, month=m)
    today = date.today()
    out   = []
    while d <= today:
        out.append(d)
        m = d.month + 1
        y = d.year + (m > 12)
        m = m if m <= 12 else m - 12
        try:
            d = d.replace(year=y, month=m, day=SIP_DAY)
        except ValueError:
            import calendar
            d = d.replace(year=y, month=m, day=calendar.monthrange(y, m)[1])
    return out

# ── Build lookup maps ─────────────────────────────────────────────────────────
lump_map = {}
for code, amt, dt, note in LUMP_SUMS:
    lump_map.setdefault(code, []).append((datetime.strptime(dt, "%Y-%m-%d").date(), amt, note))

red_map = {}
for code, name, frac, dt, note in REDEMPTION_PLAN:
    red_map.setdefault(code, []).append((frac, datetime.strptime(dt, "%Y-%m-%d").date(), note))

# ── Process each fund ─────────────────────────────────────────────────────────
all_holdings    = []
all_redemptions = []
total_invested  = 0.0
total_redeemed  = 0.0

for code, name, monthly_sip, start_str in FUNDS:
    print(f"  {code}  {name[:50]}...", file=sys.stderr)
    try:
        nav_map = fetch_nav_map(code)
    except Exception as e:
        print(f"     SKIP: {e}", file=sys.stderr)
        continue
    time.sleep(SLEEP)

    # Build chronological events
    events = []
    for d in sip_dates(start_str):
        events.append((d, monthly_sip, "sip"))
    for d, amt, note in lump_map.get(code, []):
        events.append((d, amt, f"lump:{note}"))
    for frac, d, note in red_map.get(code, []):
        events.append((d, frac, f"redeem:{note}"))
    events.sort(key=lambda x: x[0])

    cum_units    = 0.0
    cum_invested = 0.0

    for ev_date, ev_val, ev_type in events:
        nav = nav_on(nav_map, ev_date)
        if nav is None or nav <= 0:
            continue

        if ev_type.startswith("redeem"):
            note          = ev_type.split(":", 1)[1]
            units_to_sell = round(cum_units * ev_val, 4)
            if units_to_sell <= 0:
                continue
            avg_buy_nav   = (cum_invested / cum_units) if cum_units > 0 else nav
            all_redemptions.append({
                "scheme_code":  code,
                "scheme_name":  name,
                "units":        units_to_sell,
                "sell_nav":     round(nav, 4),
                "sell_date":    ev_date.strftime("%Y-%m-%d"),
                "notes":        note,
                "profile_name": "Sample Portfolio",
            })
            total_redeemed  += units_to_sell * nav
            cum_units        = round(cum_units - units_to_sell, 4)
            cum_invested    -= units_to_sell * avg_buy_nav
        else:
            units         = round(ev_val / nav, 4)
            if units <= 0:
                continue
            cum_units    += units
            cum_invested += ev_val
            total_invested += ev_val

    if cum_units > 0.001:
        avg_nav = cum_invested / cum_units if cum_units > 0 else 0
        all_holdings.append({
            "scheme_code":  code,
            "scheme_name":  name,
            "units":        round(cum_units, 4),
            "buy_nav":      round(avg_nav, 4),
            "buy_date":     start_str,
            "notes":        f"Sample: SIP {start_str} onwards",
            "profile_name": "Sample Portfolio",
        })
        print(f"     -> {cum_units:.3f} units @ avg nav {avg_nav:.2f}", file=sys.stderr)

print(f"\nTotal invested : Rs{total_invested:,.0f}", file=sys.stderr)
print(f"Total redeemed : Rs{total_redeemed:,.0f}", file=sys.stderr)
print(f"Net deployed   : Rs{total_invested - total_redeemed:,.0f}", file=sys.stderr)
print(f"Holdings       : {len(all_holdings)}", file=sys.stderr)
print(f"Redemptions    : {len(all_redemptions)}", file=sys.stderr)

# ── Output TypeScript file ─────────────────────────────────────────────────────
ts_out = Path(__file__).parent.parent / "lib" / "sampleData.ts"

holdings_json    = json.dumps(all_holdings,    indent=2)
redemptions_json = json.dumps(all_redemptions, indent=2)

ts_content = f"""// AUTO-GENERATED by scripts/gen_sample_data.py — do not edit manually.
// Represents a realistic 5-year SIP portfolio (Jun 2021 → today) with
// ₹15,250/month across 18 diversified funds, lump-sum top-ups, and partial
// redemptions. Used as the always-present "Sample Portfolio" demo profile.

import type {{ Holding, Redemption }} from './types'

export const SAMPLE_HOLDINGS: Omit<Holding, 'id' | 'created_at'>[] = {holdings_json}

export const SAMPLE_REDEMPTIONS: Omit<Redemption, 'id' | 'created_at'>[] = {redemptions_json}
"""

ts_out.write_text(ts_content, encoding="utf-8")
print(f"\nWrote {ts_out}", file=sys.stderr)
print("DONE", file=sys.stderr)
