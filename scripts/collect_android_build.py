#!/usr/bin/env python3
"""Collect one finished EAS build and reject an incorrect upload certificate.

Requires Python 3 and a JDK (keytool and jarsigner). Does not create keys,
change Expo credentials, submit to Play, or certify runtime/store compliance.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path


EXPECTED_CERT_SHA256 = (
    "AB:FD:1B:72:7E:66:E8:53:93:E2:AA:55:68:E7:C7:E6:"
    "E0:94:0E:D4:62:B4:02:A8:D4:8D:A4:E7:6A:65:76:DF"
)
EXPECTED_PROJECT = "3df011da-c836-4c63-b9b2-b6b3caae4679"


def verify_bundle(path: Path) -> None:
    with zipfile.ZipFile(path) as bundle:
        names = bundle.namelist()
        required = {"BundleConfig.pb", "base/manifest/AndroidManifest.xml", "base/resources.pb"}
        if not required.issubset(names) or bundle.testzip() is not None:
            raise ValueError("The download is not an intact Android App Bundle.")
        if len(names) != len(set(names)):
            raise ValueError("Duplicate ZIP entries in the AAB.")
        if not any(name.startswith("base/dex/") and name.endswith(".dex") for name in names):
            raise ValueError("The AAB is missing Android code.")

    cert = subprocess.run(
        ["keytool", "-J-Duser.language=en", "-J-Duser.country=US", "-printcert", "-jarfile", str(path)],
        capture_output=True, text=True, check=True, timeout=120,
    )
    fingerprints = re.findall(r"SHA256:\s*([0-9A-F:]+)", cert.stdout, re.IGNORECASE)
    if len(fingerprints) != 1 or fingerprints[0].upper() != EXPECTED_CERT_SHA256:
        actual = ", ".join(fingerprints) or "no signing certificate"
        raise ValueError(
            "The AAB does not use the original Google Play upload certificate. "
            f"Expected SHA256 {EXPECTED_CERT_SHA256}; received {actual}. "
            "Check the existing Android credentials in Expo before uploading to Play."
        )

    verification = subprocess.run(
        ["jarsigner", "-J-Duser.language=en", "-J-Duser.country=US", "-verify", "-strict", str(path)],
        capture_output=True, text=True, timeout=120,
    )
    # Android upload certificates are commonly self-signed, producing code 4.
    # Codes for unsigned entries, wrong signers or signature errors are rejected.
    if verification.returncode not in (0, 4) or "jar verified" not in verification.stdout.lower():
        raise ValueError("AAB signature integrity verification failed: " + verification.stdout + verification.stderr)


def collect_build(result_path: Path, output_path: Path) -> None:
    result = json.loads(result_path.read_text())
    builds = result if isinstance(result, list) else [result]
    if len(builds) != 1:
        raise ValueError("Expected exactly one Android EAS build.")
    build = builds[0]
    if build.get("status") != "FINISHED" or build.get("platform") != "ANDROID":
        raise ValueError("EAS has not completed the Android build successfully.")
    if build.get("project", {}).get("id") != EXPECTED_PROJECT:
        raise ValueError("The EAS build belongs to a different Expo project.")
    if str(build.get("appBuildVersion")) != "8" or build.get("appVersion") != "1.0.6":
        raise ValueError("Expected version 1.0.6 with Android versionCode 8.")
    url = build.get("artifacts", {}).get("buildUrl")
    if not url or urllib.parse.urlparse(url).scheme != "https":
        raise ValueError("EAS did not return an HTTPS download for the build.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    candidate = output_path.with_suffix(".download")
    try:
        with urllib.request.urlopen(url, timeout=120) as response, candidate.open("wb") as target:
            if urllib.parse.urlparse(response.geturl()).scheme != "https":
                raise ValueError("The artifact download redirected to a non-HTTPS URL.")
            shutil.copyfileobj(response, target)
        verify_bundle(candidate)
        candidate.replace(output_path)
    finally:
        candidate.unlink(missing_ok=True)
    print(f"Saved {output_path.name}. Original upload certificate and signature integrity verified.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("build_result", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        collect_build(args.build_result, args.output)
    except Exception as error:
        print(f"Build collection failed: {error}", file=sys.stderr)
        sys.exit(1)
