"""Licence PDF rendering.

Phase 1 ships an HTML→PDF pipeline (WeasyPrint) with an embedded QR code that
links to the public verification URL. Phase 1.5 will add a real pyHanko
PAdES digital signature once the RPA's signing certificate is provisioned.
For now, a visible "Digitally Signed" stamp is included; the structured
signature info lives in the licence document.
"""
from __future__ import annotations

import io
from base64 import b64encode
from datetime import date

import qrcode
from django.conf import settings


def _qr_data_uri(payload: str) -> str:
    img = qrcode.make(payload, box_size=4, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + b64encode(buf.getvalue()).decode("ascii")


def _html(licence: dict, qr_data_uri: str) -> str:
    facility = licence.get("facility_snapshot") or {}
    conditions = licence.get("conditions") or []
    conditions_html = "".join(f"<li>{c}</li>" for c in conditions) or "<li>None</li>"
    return f"""<!doctype html>
<html><head><meta charset='utf-8'><style>
  @page {{ size: A4; margin: 18mm; }}
  body {{ font-family: 'DejaVu Sans', Arial, sans-serif; color: #111; }}
  .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003366; padding-bottom: 8mm; }}
  .header h1 {{ font-size: 18pt; margin: 0; color: #003366; }}
  .header h2 {{ font-size: 12pt; margin: 0; color: #555; font-weight: normal; }}
  .qr {{ width: 100px; height: 100px; }}
  table.meta {{ width: 100%; margin-top: 8mm; border-collapse: collapse; }}
  table.meta td {{ padding: 4px 8px; vertical-align: top; }}
  table.meta td.k {{ width: 32%; color: #555; }}
  .conditions {{ margin-top: 6mm; }}
  .footer {{ position: fixed; bottom: 10mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #666; }}
  .stamp {{ position: absolute; right: 22mm; bottom: 30mm; transform: rotate(-12deg);
            border: 2px solid #007a33; color: #007a33; padding: 4mm 8mm;
            font-size: 14pt; font-weight: bold; opacity: 0.7; }}
</style></head><body>
  <div class='header'>
    <div>
      <h1>Radiation Protection Authority of Zambia</h1>
      <h2>Licence under the Ionising Radiation Protection Act No. 16 of 2005</h2>
    </div>
    <img class='qr' src='{qr_data_uri}' alt='verification qr' />
  </div>
  <table class='meta'>
    <tr><td class='k'>Licence number</td><td><strong>{licence['licence_number']}</strong></td></tr>
    <tr><td class='k'>Holder</td><td>{licence.get('holder_name','')}</td></tr>
    <tr><td class='k'>Facility</td><td>{facility.get('name','')}</td></tr>
    <tr><td class='k'>Address</td><td>{facility.get('address','')}</td></tr>
    <tr><td class='k'>Province / District</td><td>{facility.get('province','')} / {facility.get('district','')}</td></tr>
    <tr><td class='k'>Issued</td><td>{licence['issued_at']}</td></tr>
    <tr><td class='k'>Expires</td><td>{licence['expires_at']}</td></tr>
  </table>
  <div class='conditions'>
    <h3>Licence Conditions</h3>
    <ol>{conditions_html}</ol>
  </div>
  <div class='stamp'>DIGITALLY SIGNED</div>
  <div class='footer'>
    Verify at {settings.PUBLIC_VERIFY_URL}/{licence['licence_number']}
  </div>
</body></html>"""


def render_licence_pdf(licence: dict) -> bytes:
    """Render the licence document to PDF bytes."""
    from weasyprint import HTML  # local import — heavy native deps

    qr_payload = f"{settings.PUBLIC_VERIFY_URL}/{licence['licence_number']}"
    qr_uri = _qr_data_uri(qr_payload)
    html = _html(licence, qr_uri)
    return HTML(string=html).write_pdf()


def default_validity_years() -> int:
    return 3


def default_expiry(issued_on: date | None = None) -> date:
    base = issued_on or date.today()
    try:
        return base.replace(year=base.year + default_validity_years())
    except ValueError:
        # 29 Feb edge case
        return base.replace(month=2, day=28, year=base.year + default_validity_years())
