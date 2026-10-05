#!/usr/bin/env bash
# Two-pass build: render once to find page numbers, then rebuild with a filled TOC.
set -euo pipefail
cd "$(dirname "$0")"
WORK=/tmp/siwes-build && mkdir -p $WORK
NAME=SIWES_Report_Friday_Godswill_Essien_23-SC-CO-158
node build-report.cjs "" $WORK/pass1.docx
(cd $WORK && soffice --headless --convert-to pdf pass1.docx >/dev/null 2>&1)
python3 find-pages.py $WORK/pass1.pdf keys.json $WORK/pages.json
node build-report.cjs $WORK/pages.json "$NAME.docx"
cp "$NAME.docx" $WORK/final.docx
(cd $WORK && soffice --headless --convert-to pdf final.docx >/dev/null 2>&1)
cp $WORK/final.pdf "$NAME.pdf"
pdfinfo "$NAME.pdf" | grep Pages
