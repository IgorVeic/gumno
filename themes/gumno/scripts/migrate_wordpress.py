"""Generate the maintainable October CMS product catalogue from the old WordPress API.

The generated theme uses one dynamic product page and a JSON catalogue. Re-running this
script refreshes product copy and media without creating a page file per product.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import struct
import unicodedata
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen


THEME = Path(__file__).resolve().parents[1]
PROJECT = THEME.parents[1]
DATA_DIR = THEME / "assets" / "data"
IMAGE_DIR = THEME / "assets" / "images" / "products"
POST_CACHE = PROJECT / "wp-posts-all.json"
USER_AGENT = "Mozilla/5.0 (compatible; GumnoMigration/1.0)"


def fetch_json(url: str):
    return json.loads(urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=45).read())


def get_posts() -> list[dict]:
    if POST_CACHE.exists():
        return json.loads(POST_CACHE.read_text(encoding="utf-8"))
    result: list[dict] = []
    page = 1
    while True:
        try:
            batch = fetch_json(
                f"https://gumno.com.mk/wp-json/wp/v2/posts?per_page=100&page={page}&_embed=1"
            )
        except HTTPError as error:
            if error.code == 400:
                break
            raise
        result.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    POST_CACHE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


def plain(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\[[^\]]+\]", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def content_copy(value: str) -> str:
    decoded = html.unescape(value or "")
    blocks = re.findall(r"\[vc_column_text[^\]]*\](.*?)\[/vc_column_text\]", decoded, re.I | re.S)
    text = plain(" ".join(blocks))
    return text


def safe_tables(value: str) -> str:
    tables = re.findall(r"<table\b.*?</table>", value or "", re.I | re.S)
    cleaned: list[str] = []
    for table in tables:
        table = re.sub(r"\s(?:id|class|style)=(?:\"[^\"]*\"|'[^']*')", "", table, flags=re.I)
        table = re.sub(
            r"</?(?!(?:table|thead|tbody|tfoot|tr|th|td)\b)[a-z][^>]*>",
            "",
            table,
            flags=re.I,
        )
        cleaned.append(table)
    return "\n".join(cleaned)


def image_urls(post: dict) -> list[str]:
    decoded = html.unescape(post.get("content", {}).get("rendered", ""))
    urls = re.findall(
        r"https?://[^\s\"'“”<>]+?wp-content/uploads/[^\s\"'“”<>]+?\.(?:png|jpe?g|webp|gif)",
        decoded,
        re.I,
    )
    embedded = post.get("_embedded", {}).get("wp:featuredmedia", [])
    if embedded and embedded[0].get("source_url"):
        urls.append(embedded[0]["source_url"])
    unique: list[str] = []
    for url in urls:
        url = url.replace("http://gumno.com.mk", "https://gumno.com.mk")
        if url not in unique:
            unique.append(url)
    return unique


def full_size_url(url: str) -> str:
    return re.sub(r"-\d+x\d+(?=\.[a-z0-9]+(?:\?|$))", "", url, flags=re.I)


def file_name(url: str) -> str:
    raw = unquote(Path(urlparse(url).path).name).lower()
    stem, suffix = Path(raw).stem, Path(raw).suffix.lower()
    stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    stem = re.sub(r"[^a-z0-9]+", "-", stem).strip("-") or "product"
    suffix = suffix if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else ".jpg"
    return f"{stem}{suffix}"


def image_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data.startswith(b"\x89PNG") and len(data) >= 24:
        return struct.unpack(">II", data[16:24])
    if data[:3] == b"GIF" and len(data) >= 10:
        return struct.unpack("<HH", data[6:10])
    if data[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in range(0xC0, 0xC4):
                return struct.unpack(">HH", data[i + 5 : i + 9])[::-1]
            if i + 4 > len(data):
                break
            i += 2 + struct.unpack(">H", data[i + 2 : i + 4])[0]
    return (800, 800)


def download_image(urls: list[str], used_names: dict[str, str]) -> tuple[str, int, int]:
    for original in urls:
        candidates = [full_size_url(original), original]
        for url in dict.fromkeys(candidates):
            name = file_name(url)
            if name in used_names and used_names[name] != url:
                name = f"{Path(name).stem}-{hashlib.sha1(url.encode()).hexdigest()[:7]}{Path(name).suffix}"
            destination = IMAGE_DIR / name
            try:
                if not destination.exists():
                    payload = urlopen(
                        Request(url, headers={"User-Agent": USER_AGENT}), timeout=45
                    ).read()
                    if len(payload) < 100:
                        continue
                    destination.write_bytes(payload)
                used_names[name] = url
                width, height = image_size(destination)
                return f"products/{name}", width, height
            except (HTTPError, URLError, TimeoutError, OSError):
                continue
    return "", 800, 800


def categories(post: dict) -> list[str]:
    return [
        plain(term.get("name", ""))
        for group in post.get("_embedded", {}).get("wp:term", [])
        for term in group
        if term.get("taxonomy") == "category" and term.get("name") != "Uncategorized"
    ]


def catalogue_group(title: str, category_names: list[str]) -> list[str]:
    haystack = f"{title} {' '.join(category_names)}".lower()
    groups: list[str] = []
    tests = {
        "pvc": ("цев", "pvc", "фитинг", "колено", "редуц", "муф", "теком", "нипла", "спој"),
        "sanitarija": ("wc", "школ", "шољ", "умивал", "биде", "писоар", "казанч", "сифон", "бојлер", "туш"),
        "baterii": ("славин", "батери", "вентил", "чешм", "холендар"),
        "plocki": ("плоч", "керами"),
    }
    for group, words in tests.items():
        if any(word in haystack for word in words):
            groups.append(group)
    return groups or ["ostanato"]


def build_catalogue() -> list[dict]:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    used_names: dict[str, str] = {}
    products: list[dict] = []
    for post in get_posts():
        title = plain(post.get("title", {}).get("rendered", "")) or "Производ"
        slug = unquote(post.get("slug", "")).strip("/")
        description = plain(post.get("yoast_head_json", {}).get("description", ""))
        description = description or content_copy(post.get("content", {}).get("rendered", ""))
        description = description or plain(post.get("excerpt", {}).get("rendered", ""))
        description = description or f"{title} од продажната програма на Гумно Охрид."
        category_names = categories(post)
        image, width, height = download_image(image_urls(post), used_names)
        products.append(
            {
                "slug": slug,
                "title": title,
                "description": description,
                "meta_description": description[:157].rstrip(" ,.;") + ("…" if len(description) > 157 else ""),
                "image": image,
                "width": width,
                "height": height,
                "categories": category_names,
                "groups": catalogue_group(title, category_names),
                "details_html": safe_tables(post.get("content", {}).get("rendered", "")),
            }
        )
    products.sort(key=lambda item: item["title"].casefold())
    (DATA_DIR / "products.json").write_text(
        json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return products


if __name__ == "__main__":
    products = build_catalogue()
    with_images = sum(bool(product["image"]) for product in products)
    print(f"Generated {len(products)} products; {with_images} have local images.")
