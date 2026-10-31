#!/usr/bin/env bash
set -euo pipefail

deb_file="${1:?Usage: fix-deb-launcher-name.sh path/to/package.deb}"
deb_file="$(realpath "$deb_file")"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

dpkg-deb --raw-extract "$deb_file" "$work_dir/package"
desktop_file="$(find "$work_dir/package/opt/painho-lula/lib" -maxdepth 1 -type f -name '*.desktop' -print -quit)"
if [[ -z "$desktop_file" ]]; then
    echo "Could not find the launcher desktop entry in the package." >&2
    exit 1
fi

# Keep the generated filename unchanged: the package maintainer scripts refer to it.
sed -i 's/^Name=.*/Name=LqMusic/' "$desktop_file"
dpkg-deb -Zgzip -z1 --build --root-owner-group "$work_dir/package" "$work_dir/fixed.deb" >/dev/null
mv "$work_dir/fixed.deb" "$deb_file"
