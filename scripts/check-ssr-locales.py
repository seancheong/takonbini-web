"""Read-only SSR locale checks; exits nonzero when a response uses the wrong language."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import re
from urllib.request import Request, urlopen

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("base_url", help="Local build or deployed site origin")
args = parser.parse_args()
cases = [
    ("/?lang=ja", "zh", "en", "ja"),
    ("/?lang=zh", "en", "ja", "zh-Hant"),
    ("/?lang=en", "ja", "zh", "en"),
    ("/?lang=fr", "ja", "en", "ja"),
    ("/", "zh", "en", "zh-Hant"),
    ("/", "", "en;q=0.5,ja;q=0.9", "ja"),
]


def check(case):
    path, saved, browser, expected = case
    request = Request(
        args.base_url.rstrip("/") + path,
        headers={
            "Cookie": "i18nextTakonbiniLng=" + saved,
            "Accept-Language": browser,
        },
    )
    with urlopen(request, timeout=60) as response:
        html = response.read().decode()
        match = re.search(r'<html[^>]*lang="([^"]+)"', html)
        actual = match.group(1) if match else None
        return {
            "path": path,
            "saved": saved,
            "browser": browser,
            "expected": expected,
            "actual": actual,
            "status": response.status,
            "pass": response.status == 200 and actual == expected,
        }


sequential = [check(case) for case in cases]
with ThreadPoolExecutor(max_workers=6) as pool:
    concurrent = list(pool.map(check, cases * 2))
passed = all(result["pass"] for result in sequential + concurrent)
print(json.dumps({
    "at": datetime.now(timezone.utc).isoformat(),
    "target": args.base_url,
    "sequential": sequential,
    "concurrent": concurrent,
    "all_pass": passed,
}, indent=2))
raise SystemExit(0 if passed else 1)
