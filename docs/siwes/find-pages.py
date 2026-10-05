"""Reads a rendered PDF of the report and writes pages.json for the TOC and lists.
Usage: python3 find-pages.py report.pdf keys.json pages.json"""
import json, re, subprocess, sys

pdf, keys_file, out = sys.argv[1:4]
keys = json.load(open(keys_file))
n = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout).group(1))
pages = []
for i in range(1, n + 1):
    t = subprocess.run(["pdftotext", "-f", str(i), "-l", str(i), "-layout", pdf, "-"], capture_output=True, text=True).stdout
    pages.append(t)
norm = lambda s: re.sub(r"\s+", " ", s).strip()
flat = [norm(p) for p in pages]
lines = [[norm(l) for l in p.splitlines() if l.strip()] for p in pages]

body_start = next(i for i, ls in enumerate(lines) if "CHAPTER ONE" in ls)
roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"]
result = {}
for k in keys["front"]:
    for i in range(1, body_start):
        if k in lines[i][:2]:
            result[k] = roman[i - 1]
            break
pos = body_start
for k in keys["body"]:
    for i in range(pos, n):
        found = (k in lines[i]) if (k.startswith("CHAPTER") or k in ("REFERENCES", "APPENDIX")) else (norm(k) in flat[i])
        if found:
            result[k] = str(i - body_start + 1)
            pos = i
            break
    else:
        print("not found:", k)
for k in keys["captions"]:
    for i in range(body_start, n):
        if (k + ":") in flat[i]:
            result[k] = str(i - body_start + 1)
            break
    else:
        print("not found:", k)
json.dump(result, open(out, "w"), indent=1)
print(f"pages: {n} total, front matter ends at {body_start}, body pages {n - body_start}")
