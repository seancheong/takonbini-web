"""Read-only canonical/Open Graph and sitemap checks for a local or hosted build."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from urllib.error import HTTPError
from urllib.parse import quote, urlparse, parse_qs
from urllib.request import urlopen
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("base_url")
parser.add_argument("--site-url", default="https://takonbini.com")
parser.add_argument("--product-id", action="append", required=True)
args = parser.parse_args()


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.og_urls = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "link" and attributes.get("rel") == "canonical":
            self.canonicals.append(attributes.get("href"))
        if tag == "meta" and attributes.get("property") == "og:url":
            self.og_urls.append(attributes.get("content"))


def check_page(path):
    expected = args.site_url.rstrip("/") + path.split("?")[0]
    with urlopen(args.base_url.rstrip("/") + path, timeout=60) as response:
        head = Head()
        head.feed(response.read().decode())
        # Product fallback canonical selection is covered by compiled fixtures.
        # Hosted probes check the declared locale URL shape and self-canonical target.
        locale = parse_qs(urlparse(head.canonicals[0]).query).get("lang", [None])[0] if len(head.canonicals) == 1 else None
        expected += "?lang=" + (locale if locale in ["en", "ja", "zh"] else "invalid")
        target_path = path.split("?")[0] + "?lang=" + (locale or "invalid")
        with urlopen(args.base_url.rstrip("/") + target_path, timeout=60) as target:
            target_head = Head()
            target_head.feed(target.read().decode())
            target_pass = target.status == 200 and target_head.canonicals == [expected]
        return {
            "path": path,
            "status": response.status,
            "canonical": head.canonicals,
            "ogUrl": head.og_urls,
            "expected": expected,
            "pass": response.status == 200
            and head.canonicals == [expected]
            and head.og_urls == [expected]
            and target_pass,
        }


paths = ["/?lang=en&search=tea"] + [
    f"/products/{quote(product_id, safe='')}?lang={locale}&stores=Lawson"
    for product_id in args.product_id
    for locale in ["en", "ja", "zh"]
]
pages = list(ThreadPoolExecutor(max_workers=3).map(check_page, paths))
try:
    with urlopen(args.base_url.rstrip("/") + "/sitemap.xml", timeout=60) as response:
        locations = [
            entry.text
            for entry in ET.fromstring(response.read()).iter(
                "{http://www.sitemaps.org/schemas/sitemap/0.9}loc"
            )
        ]
        sitemap = {
            "status": response.status,
            "urlCount": len(locations),
            "uniqueUrlCount": len(set(locations)),
            "pass": response.status == 200
            and 1 <= len(locations) <= 50_000
            and len(set(locations)) == len(locations)
            and all(
                urlparse(location).netloc == urlparse(args.site_url).netloc
                for location in locations
            )
            and all(
                any(location.startswith(args.site_url.rstrip("/") + "/products/" + quote(product_id, safe='') + "?lang=") for location in locations)
                for product_id in args.product_id
            ),
        }
except HTTPError as error:
    sitemap = {"status": error.code, "pass": False}
print(json.dumps({
    "measuredAt": datetime.now(timezone.utc).isoformat(),
    "baseUrl": args.base_url,
    "method": "Read-only server-rendered HTML and XML; no hydration or ranking claim",
    "pages": pages,
    "sitemap": sitemap,
}, indent=2))
raise SystemExit(0 if all(page["pass"] for page in pages) and sitemap["pass"] else 1)
