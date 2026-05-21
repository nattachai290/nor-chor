#!/usr/bin/env python3
"""
Download P5X character portrait images from lufel.net.

Run this script on your local machine (NOT in CI/cloud):
  python3 scripts/download-portraits.py

Images are saved to public/portraits/ and should be committed to the repo.
"""
import urllib.parse, subprocess, os, sys

PORTRAITS = [
    ("렌",        "joker"),
    ("앤",        "panther"),
    ("류지",      "skull"),
    ("카스미",    "violet"),
    ("후타바",    "oracle"),
    ("아야카",    "chord"),
    ("리코",      "wind"),
    ("야오링",    "rin"),
    ("세이지",    "fleuret"),
    ("마나카",    "ange"),
    ("유스케",    "fox"),
    ("유키 마코토", "queen"),
    ("아케치",    "crow"),
    ("루체",      "luce"),
    ("터보",      "turbo"),
    ("마토이",    "matoi"),
    ("하울러",    "howler"),
    ("제이앤씨",  "jandc"),
    ("누아르",    "noir"),
    ("체리쉬",    "cherish"),
    ("메사",      "messa"),
    ("포이비",    "phoebe"),
    ("마리안",    "marian"),
    ("모나",      "mona"),
    ("미나미",    "bui"),
    ("루펠",      "lufel"),
    ("유이",      "yui"),
    ("비노",      "vino"),
    ("리들",      "riddle"),
    ("캐틀",      "cattle"),
    ("레온",      "leon"),
    ("클로저",    "closer"),
    ("몽",        "mont"),
    ("소이",      "soy"),
    ("유키",      "yuki"),
    ("키",        "key"),
    ("모코",      "moko"),
    ("세피아",    "sepia"),
    ("퍼핏",      "puppet"),
    ("오키얀",    "okyann"),
]

BASE_URL = "https://lufel.net/assets/img/character-cards/"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "portraits")
os.makedirs(OUT_DIR, exist_ok=True)

ok, fail, skip = 0, 0, 0

for korean, codename in PORTRAITS:
    out = os.path.join(OUT_DIR, f"{codename}.webp")
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        print(f"  SKIP {codename}")
        skip += 1
        continue

    url = BASE_URL + urllib.parse.quote(korean) + ".webp"
    r = subprocess.run([
        "curl", "-s", "-L", "-o", out, "--max-time", "15",
        "-H", "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        "-H", "Referer: https://lufel.net/en/character/",
        "-H", "Accept: image/webp,image/avif,image/*,*/*;q=0.8",
        "-H", "Accept-Language: ko-KR,ko;q=0.9,en;q=0.8",
        url,
    ], capture_output=True)

    size = os.path.getsize(out) if os.path.exists(out) else 0
    if size > 1000:
        print(f"  OK   {codename} ({size:,} bytes)")
        ok += 1
    else:
        print(f"  FAIL {codename} <- {korean} (size={size})")
        if os.path.exists(out):
            os.remove(out)
        fail += 1

print(f"\nDone: {ok} downloaded, {skip} skipped, {fail} failed")
if fail:
    print("For failed ones, try opening the URL in your browser and saving manually.")
    print(f"  {BASE_URL}[korean-name].webp")
