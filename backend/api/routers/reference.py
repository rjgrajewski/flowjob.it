import logging

import httpx
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api", tags=["reference"])
logger = logging.getLogger(__name__)

RADON_ENDPOINT = "https://radon.nauka.gov.pl/opendata/polon/institutions"
HIPOLABS_ENDPOINT = "https://universities.hipolabs.com/search"


def _unique_preserving_order(items: list[str]) -> list[str]:
    seen = set()
    unique_items = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        unique_items.append(item)
    return unique_items


async def _fetch_radon_results(client: httpx.AsyncClient, query: str) -> list[str]:
    response = await client.get(
        RADON_ENDPOINT,
        params={"name": query, "resultLevel": 1},
    )
    response.raise_for_status()
    payload = response.json()
    return [
        result.get("name", "").strip()
        for result in payload.get("results", [])
    ]


async def _fetch_hipolabs_results(client: httpx.AsyncClient, query: str) -> list[str]:
    response = await client.get(
        HIPOLABS_ENDPOINT,
        params={"name": query, "country": "Poland"},
    )
    response.raise_for_status()
    payload = response.json()
    return [
        result.get("name", "").strip()
        for result in payload
    ]


@router.get("/universities")
async def get_universities(
    query: str = Query("", min_length=0, max_length=120, description="University search term"),
):
    normalized_query = query.strip()
    if len(normalized_query) < 3:
        return {"results": []}

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(5.0, connect=5.0),
        headers={"Accept": "application/json"},
    ) as client:
        for source_name, fetcher in (
            ("RAD-on", _fetch_radon_results),
            ("Hipolabs", _fetch_hipolabs_results),
        ):
            try:
                results = await fetcher(client, normalized_query)
                if results:
                    return {"results": _unique_preserving_order(results)[:10]}
            except (httpx.HTTPError, ValueError) as exc:
                logger.warning("University lookup failed via %s: %s", source_name, exc)

    return {"results": []}
