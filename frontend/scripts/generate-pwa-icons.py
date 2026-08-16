"""Generate PWA PNG icons without third-party image libraries."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

BG = (10, 10, 10)
ACCENT = (29, 185, 84)
WHITE = (255, 255, 255)


def _chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, size: int) -> None:
    cx = cy = (size - 1) / 2
    radius = size * 0.36
    rows: list[bytes] = []

    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            dx = x - cx
            dy = y - cy
            if dx * dx + dy * dy <= radius * radius:
                # White play triangle inside the green circle.
                local_x = dx / radius
                local_y = dy / radius
                in_triangle = (
                    local_x >= -0.22
                    and local_x <= 0.38
                    and abs(local_y) <= 0.42 * (1 - (local_x + 0.22) / 0.6)
                )
                color = WHITE if in_triangle else ACCENT
            else:
                color = BG
            row.extend(color)
        rows.append(bytes(row))

    raw = b"".join(rows)
    png = b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            _chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)),
            _chunk(b"IDAT", zlib.compress(raw, 9)),
            _chunk(b"IEND", b""),
        ]
    )
    path.write_bytes(png)


def main() -> None:
    icons = Path(__file__).resolve().parents[1] / "public" / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        dest = icons / f"icon-{size}.png"
        write_png(dest, size)
        print(f"Wrote {dest}")


if __name__ == "__main__":
    main()
