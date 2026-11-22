#!/usr/bin/env python3
"""0-Token Static Site Integrity, Asset & Security Gate for ideal-type + pet-card + worker."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    errors = []

    # 1. Validate pool.json parses cleanly
    pool_path = ROOT / "pool.json"
    if not pool_path.exists():
        errors.append("Missing pool.json")
    else:
        try:
            pool = json.loads(pool_path.read_text(encoding="utf-8"))
            if not pool:
                errors.append("pool.json is empty")
        except Exception as e:
            errors.append(f"Invalid pool.json: {e}")

    # 2. Verify pet-card/index.html referenced local images exist & Stripe/brand links are HTTPS
    pc_html_path = ROOT / "pet-card" / "index.html"
    if not pc_html_path.exists():
        errors.append("Missing pet-card/index.html")
    else:
        pc_html = pc_html_path.read_text(encoding="utf-8")
        for img in re.findall(r'<img[^>]+src="([^"]+)"', pc_html):
            if not img.startswith(("http://", "https://", "data:")):
                if not (ROOT / "pet-card" / img).exists():
                    errors.append(f"Missing pet-card image asset: pet-card/{img}")
        if re.search(r"http://[A-Za-z0-9.\-]*(plaigroundlab\.com|stripe\.com)", pc_html):
            errors.append("Insecure http:// brand/Stripe link in pet-card/index.html")

    # 3. Verify worker/src/index.js security primitives
    worker_js = (ROOT / "worker" / "src" / "index.js").read_text(encoding="utf-8")
    for req_sym in ("crypto.subtle", "timingSafeEqual", "SIGNATURE_TOLERANCE_SEC", "checkout.session.completed"):
        if req_sym not in worker_js:
            errors.append(f"Worker missing required security symbol: {req_sym}")

    # 4. Scan entire repo for secret leaks (excluding unit-test dummy strings)
    secret_pats = [
        (re.compile(r"ghp_[A-Za-z0-9]{20,}"), "GitHub PAT"),
        (re.compile(r"sk_live_[A-Za-z0-9]{16,}"), "Stripe live secret key"),
        (re.compile(r"whsec_(?!test_unit_only)[A-Za-z0-9]{16,}"), "Stripe webhook secret"),
        (re.compile(r"fmb_[A-Za-z0-9_\-]{20,}"), "Mailbox token"),
    ]
    for p in ROOT.rglob("*"):
        if not p.is_file() or ".git" in p.parts:
            continue
        if p.suffix not in (".html", ".js", ".mjs", ".css", ".json", ".py", ".md", ".toml", ".yml"):
            continue
        txt = p.read_text(encoding="utf-8", errors="replace")
        for pat, label in secret_pats:
            if pat.search(txt):
                errors.append(f"Potential secret ({label}) in {p.relative_to(ROOT)}")

    if errors:
        for e in errors:
            print(f"[FAIL] {e}", file=sys.stderr)
        sys.exit(1)
    print("SITE & WORKER VERIFY PASS (0 errors).")


if __name__ == "__main__":
    main()
