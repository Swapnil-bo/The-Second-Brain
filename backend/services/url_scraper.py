# Description: URL content scraper using httpx + BeautifulSoup4. Fetches page HTML,
# strips boilerplate, and returns clean text + page title.

import httpx
from bs4 import BeautifulSoup


async def scrape_url(url: str) -> dict:
    """
    Fetch and extract readable text from a URL.

    Returns: {"title": str, "content": str, "url": str}
    Raises ValueError on network errors or inaccessible content.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            response = await client.get(str(url), headers=headers)
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        if e.response.status_code in (401, 403):
            raise ValueError("URL content is not publicly accessible")
        raise ValueError(f"HTTP error {e.response.status_code} fetching URL")
    except httpx.RequestError:
        raise ValueError("Could not fetch URL content")

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove non-content elements
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else str(url)

    # Extract text from meaningful content tags
    content_tags = soup.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th", "pre", "code", "blockquote"])
    paragraphs = [tag.get_text(separator=" ", strip=True) for tag in content_tags]
    content = "\n\n".join(p for p in paragraphs if len(p) > 20)

    if not content.strip():
        # Fallback: grab all remaining body text
        body = soup.find("body")
        content = body.get_text(separator="\n", strip=True) if body else ""

    if not content.strip():
        raise ValueError("URL content is not publicly accessible")

    return {"title": title, "content": content, "url": str(url)}
