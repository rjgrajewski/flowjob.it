#!/usr/bin/env python3
"""
Normalize skills from mechanism offers using AWS Bedrock (Claude).
STRATEGY: Distinct Skills

This script:
1. Extracts DISTINCT raw skills (from tech_stack) + Category from offers.
2. Inserts them into `skills` table (original_skill_name).
3. Fetches un-normalized skills from `skills` table.
4. Uses AWS Bedrock to normalize them (Context: Category).
5. Updates `skills` table with canonical_skill_name.
6. Links offers to skills in `offer_skills` table based on raw text match.
"""

import asyncio
import asyncpg
import logging
import sys
import os
import json
from pathlib import Path
from typing import List, Dict, Set, Tuple
import re
from dotenv import load_dotenv
import boto3

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scout.db import get_database_dsn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Separators used to join multiple skills in a single tech_stack entry.
# We normalise first, then split — handles patterns like "A, B, or C" or "A/B or C".
_OR_PATTERN = re.compile(r',?\s+or\s+', re.IGNORECASE)
_DELIM_PATTERN = re.compile(r'\s*/\s*|,\s*')

def split_multi_skill_string(raw: str) -> List[str]:
    """
    Split a raw skill string that may contain multiple skills joined by
    separators like '/', ', ', ' OR ', ' or ', or combinations thereof.

    Examples:
        'Python/TypeScript/C#'       -> ['Python', 'TypeScript', 'C#']
        'Node.js OR Python OR Go'    -> ['Node.js', 'Python', 'Go']
        'Python, TypeScript, or C#'  -> ['Python', 'TypeScript', 'C#']
        'Python or R'                -> ['Python', 'R']
        'Python'                     -> ['Python']
    Returns a list of stripped, non-empty individual skill names.
    """
    # Step 1: normalise " or " / ", or " -> ","  (handles trailing Oxford comma too)
    normalised = _OR_PATTERN.sub(',', raw)
    # Step 2: split on "/" and ","
    parts = _DELIM_PATTERN.split(normalised)
    return [p.strip() for p in parts if p.strip()]



async def init_tables(conn: asyncpg.Connection):
    """Initialize necessary tables."""
    # Ensure offer_skills exists
    schema_path = Path(__file__).parent.parent / "sql" / "tables" / "offer_skills.sql"
    if schema_path.exists():
        await conn.execute(schema_path.read_text())
    
    # Ensure skills table has necessary columns/constraints (handled by schema)
    logging.info("✅ Tables initialized.")

async def extract_distinct_skills(conn: asyncpg.Connection):
    """
    Step 1 & 2: Extract distinct skills from ALL offers and insert into skills table.
    We parse the JSON-like 'tech_stack' array from offers.
    """
    logging.info("🔍 Extracting distinct skills from offers...")
    
    # Fetch all offers with tech_stack
    query = """
        SELECT job_url, tech_stack, category
        FROM offers 
        WHERE tech_stack IS NOT NULL
    """
    rows = await conn.fetch(query)
    
    new_skills_count = 0
    
    # Use a set to track (skill, category) uniqueness in memory before DB insert
    # normalizing raw skill to lowercase for deduplication might be good, 
    # but let's keep original casing for now and rely on DB generic uniqueness if any.
    # Actually, the skills table has unique constraint on `original_skill_name`.
    # We should probably combine category? No, skill name should be unique globally? 
    # "Python" in Data vs "Python" in Backend is the same skill.
    # "Go" in Backend vs "Go" (game) - rare conflict.
    # Let's stick to unique `original_skill_name`.
    
    # We collect all raw skills first
    distinct_skills = set()
    skill_category_map = {} # Keep one category sample for context
    
    for row in rows:
        tech_stack = row['tech_stack']
        category = row['category']
        try:
            skills_list = []
            ts_str = tech_stack.strip()
            
            # 1. Try JSON
            if ts_str.startswith('[') or ts_str.startswith('{'):
                try:
                    parsed = json.loads(ts_str)
                    if isinstance(parsed, list):
                        skills_list = parsed
                    elif isinstance(parsed, dict):
                        skills_list = list(parsed.keys())
                except json.JSONDecodeError:
                    pass
            
            # 2. Text Parsing (if JSON failed or wasn't JSON)
            if not skills_list:
                # Split by semicolon first (common in this dataset)
                # Format: "Skill: Level; Skill2: Level"
                delimiter = ';' if ';' in ts_str else ','
                parts = ts_str.split(delimiter)
                
                for p in parts:
                    # Remove level suffix if present (e.g. "Java: Regular")
                    # But be careful about "C++: Advanced" -> "C++" vs "Project: X"
                    # Heuristic: split by last colon? Or first?
                    # "Java: Regular" -> split on first colon is safe usually.
                    if ':' in p:
                        s_name = p.split(':', 1)[0].strip()
                    else:
                        s_name = p.strip()
                    
                    if s_name:
                        skills_list.append(s_name)

            for skill in skills_list:
                skill_clean = str(skill).strip()
                if not skill_clean or len(skill_clean) >= 100:
                    continue
                # Store raw skill name UNCHANGED — AI will decide how to normalize
                distinct_skills.add(skill_clean)
                if skill_clean not in skill_category_map:
                    skill_category_map[skill_clean] = category
                         
        except Exception as e:
            logging.warning(f"Failed to parse tech_stack for {row['job_url']}: {e}")

    logging.info(f"👉 Found {len(distinct_skills)} distinct raw skills.")
    
    # Bulk insert (ignoring duplicates).
    # Uses the partial unique index: unique on original_skill_name WHERE canonical_skill_name IS NULL.
    insert_query = """
        INSERT INTO skills (original_skill_name, category)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
    """
    
    # Prepare batch
    batch_data = [(s, skill_category_map.get(s)) for s in distinct_skills]
    
    try:
        await conn.executemany(insert_query, batch_data)
        logging.info("✅ Distinct skills populated in DB.")
    except Exception as e:
        logging.error(f"❌ Failed to insert skills: {e}")
        
    return distinct_skills, skill_category_map

async def get_unnormalized_skills(conn: asyncpg.Connection, limit: int = 50) -> List[Dict]:
    """Fetch skills that don't have a canonical name yet."""
    query = """
        SELECT original_skill_name, category
        FROM skills
        WHERE canonical_skill_name IS NULL
        LIMIT $1
    """
    rows = await conn.fetch(query, limit)
    return [dict(row) for row in rows]

def normalize_batch_with_ai(skills_data: List[Dict], bedrock_client) -> Dict[str, object]:
    """
    Step 3: Normalize a batch of skills using Bedrock.
    Returns: { "raw_skill": "Canonical Name" }
            OR { "raw_skill": ["Name1", "Name2", ...] }  (when AI splits a multi-skill string)
    """
    if not skills_data:
        return {}
        
    # Input map: Raw -> Category (Context)
    input_map = {s['original_skill_name']: s['category'] for s in skills_data}
    input_json = json.dumps(input_map, indent=2)
    
    prompt = f"""You are a technical data cleaner. Normalize raw technical skills scraped from job postings.

Input is a JSON object: {{ "Raw Name": "Category" }}
Output must be a JSON object where each value is either a STRING or a LIST OF STRINGS:
  {{ "Raw Name": "Canonical Name" }}         -- single canonical name
  {{ "Raw Name": ["Name1", "Name2", ...] }}  -- multiple canonical names (when splitting)

Rules:
1. **Single skills**: Return a single string.
   - "React.js" -> "React"
   - "NodeJS" -> "Node.js"
   - "Amazon Web Services" -> "AWS"
2. **Multi-skill strings** (joined by `/`, `OR`, `or`, `,`):
   - If they are DISTINCT technologies -> return a LIST of individual canonical names.
     e.g. "Python/TypeScript/C#" -> ["Python", "TypeScript", "C#"]
     e.g. "Go/Ruby/Python" -> ["Go", "Ruby", "Python"]
   - If they are SYNONYMS of ONE concept -> return a SINGLE generalized name.
     e.g. "AWS/Azure/Google Cloud" -> "Cloud Platforms"
     e.g. "MySQL/PostgreSQL/Oracle" -> "SQL Databases"
3. **Formatting**: Standard capitalization (e.g. "iOS", "PostgreSQL", "Node.js").
4. **Context**: Use Category to disambiguate when needed.

Input:
{input_json}
"""

    try:
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4000,
            "temperature": 0.0,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        model_id = "eu.anthropic.claude-sonnet-4-5-20250929-v1:0" # Default
        # Fallback list if needed, similar to before
        
        response = bedrock_client.invoke_model(modelId=model_id, body=json.dumps(request_body))
        response_body = json.loads(response['body'].read())
        text = response_body['content'][0]['text'].strip()
        
        if text.startswith("```json"): text = text.split("```json")[1]
        if text.endswith("```"): text = text.rsplit("```", 1)[0]
        
        result_map = json.loads(text.strip())
        
        # DEBUG: Check for mismatches
        input_keys = {s['original_skill_name'] for s in skills_data}
        output_keys = set(result_map.keys())
        
        missing = input_keys - output_keys
        extra = output_keys - input_keys
        
        if missing or extra:
            logging.warning(f"⚠️ Key Mismatch in batch! Missing: {len(missing)}, Extra: {len(extra)}")
            if missing: logging.warning(f"Sample Missing: {list(missing)[:3]}")
            if extra: logging.warning(f"Sample Extra: {list(extra)[:3]}")
            
        return result_map
        
    except Exception as e:
        logging.error(f"❌ AI Normalization failed: {e}")
        return {}

async def update_canonical_names(conn: asyncpg.Connection, mapping: Dict[str, object]):
    """
    Update the skills table with normalized names.
    Handles both single names (str) and multi-canonical lists (list).
    When AI returns a list, the first name updates the existing row;
    additional names create new rows with the same original_skill_name.
    """
    if not mapping:
        return

    single_updates = []   # (original, canonical)
    multi_inserts = []    # rows to INSERT for extra canonical names

    for original, canonical in mapping.items():
        if isinstance(canonical, list):
            if not canonical:
                continue
            # First element updates the existing pending row
            single_updates.append((original, canonical[0]))
            # Remaining elements become new rows
            for extra_name in canonical[1:]:
                multi_inserts.append((original, extra_name))
        else:
            single_updates.append((original, str(canonical)))

    # 1. Update existing pending rows
    if single_updates:
        await conn.executemany("""
            UPDATE skills
            SET canonical_skill_name = $2
            WHERE original_skill_name = $1
              AND canonical_skill_name IS NULL
        """, single_updates)
        logging.info(f"✅ Updated {len(single_updates)} skills with canonical names.")

    # 2. Insert extra rows for multi-canonical skills
    if multi_inserts:
        # Fetch category for each original skill to carry over to new rows
        originals = list({orig for orig, _ in multi_inserts})
        cat_rows = await conn.fetch(
            "SELECT original_skill_name, category FROM skills WHERE original_skill_name = ANY($1)",
            originals
        )
        cat_map = {r['original_skill_name']: r['category'] for r in cat_rows}

        insert_data = [
            (orig, canon, cat_map.get(orig))
            for orig, canon in multi_inserts
        ]
        await conn.executemany("""
            INSERT INTO skills (original_skill_name, canonical_skill_name, category)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
        """, insert_data)
        logging.info(f"✅ Inserted {len(multi_inserts)} extra canonical rows for multi-skill strings.")

async def deduplicate_canonical_skills(conn: asyncpg.Connection, bedrock_client):
    """
    Step 5: Semantic Deduplication.
    Clusters canonical names to merge synonyms (e.g. "AI assistants" -> "AI Code Assistants").
    """
    logging.info("🧠 Starting Semantic Deduplication...")
    
    # 1. Fetch all DISTINCT canonical names
    rows = await conn.fetch("SELECT DISTINCT canonical_skill_name FROM skills WHERE canonical_skill_name IS NOT NULL")
    canonicals = [r['canonical_skill_name'] for r in rows]
    
    if not canonicals:
        logging.info("No canonical skills found to deduplicate.")
        return

    logging.info(f"Found {len(canonicals)} unique canonical skills to analyze.")

    # 2. Process in chunks
    chunk_size = 200
    updates = {}
    
    for i in range(0, len(canonicals), chunk_size):
        chunk = canonicals[i:i+chunk_size]
        logging.info(f"Analyzing chunk {i}-{i+chunk_size}...")
        
        prompt = f"""You are a technical data cleaner. I have a list of technical skills. 
Many are synonyms or near-duplicates (e.g. "AI Assistant", "AI Code Assistant", "Copilot").

Input List:
{json.dumps(chunk, indent=1)}

Task:
1. Identify clusters of synonyms.
2. Choose ONE best canonical name for each cluster (e.g. "AI Code Assistants").
3. Return a JSON object mapping REDUNDANT names to the BEST name.
   - Do NOT include names that remain unchanged.
   - Format: {{ "Redundant Name": "Best Name" }}

Rules:
- **CONSERVATISM**: Merge ONLY when semantically IDENTICAL.
- **NO BROADENING**: Do NOT merge distinct tools into a category.
  - "AWS" != "Azure" (Keep separate)
  - "Manual Testing" != "QA" (Keep separate)
  - "React" != "React Native" (Keep separate)

Example Output:
{{
  "AI Assistant": "AI Code Assistants",
  "ReactJS": "React",
  "aws-lambda": "AWS Lambda"
}}
"""

        try:
            response = bedrock_client.invoke_model(
                modelId="anthropic.claude-3-haiku-20240307-v1:0",
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 2000,
                    "messages": [{"role": "user", "content": prompt}]
                })
            )
            
            result_body = json.loads(response['body'].read())
            content_text = result_body['content'][0]['text']
            
            # Extract JSON from response
            json_str = content_text.strip()
            if "{" in json_str:
                json_str = json_str[json_str.find("{"):json_str.rfind("}")+1]
                
            chunk_updates = json.loads(json_str)
            
            if chunk_updates:
                logging.info(f"Found {len(chunk_updates)} merges in this chunk.")
                updates.update(chunk_updates)
                
        except Exception as e:
            logging.error(f"Deduplication failed for chunk: {e}")

    # 3. Apply updates
    if updates:
        logging.info(f"Applying {len(updates)} semantic merges to DB...")
        
        # We need to update existing rows to point to the new canonical name
        # BUT wait, multiple raw skills might map to the same OLD canonical.
        # We just need to update `canonical_skill_name` where it matches the old one.
        
        update_query = """
            UPDATE skills 
            SET canonical_skill_name = $1 
            WHERE canonical_skill_name = $2
        """
        
        batch = [(new, old) for old, new in updates.items()]
        await conn.executemany(update_query, batch)
        logging.info("✅ Semantic deduplication applied.")

async def link_offers_to_skills(conn: asyncpg.Connection):
    """
    Step 4: Link offers to skills based on text match.
    One original_skill_name may map to MULTIPLE skill rows (multi-canonical),
    so we link the offer to ALL of them.
    """
    logging.info("🔗 Linking offers to skills...")

    # Build skill_map: original_skill_name -> list of UUIDs
    # (one raw string may have been split into several canonical rows)
    from collections import defaultdict
    skill_rows = await conn.fetch("SELECT original_skill_name, uuid FROM skills")
    skill_map: Dict[str, List] = defaultdict(list)
    for row in skill_rows:
        skill_map[row['original_skill_name']].append(row['uuid'])

    logging.info(f"Loaded {len(skill_map)} distinct raw skills for linking.")

    query = "SELECT job_url, tech_stack FROM offers WHERE tech_stack IS NOT NULL"

    async with conn.transaction():
        async for row in conn.cursor(query):
            job_url = row['job_url']
            tech_stack = row['tech_stack']

            # Parse stack
            try:
                if isinstance(tech_stack, str):
                    try:
                        skills_list = json.loads(tech_stack)
                    except Exception:
                        skills_list = [s.strip() for s in tech_stack.split(',')]
                elif isinstance(tech_stack, list):
                    skills_list = tech_stack
                else:
                    skills_list = []
            except Exception:
                skills_list = []

            # Link offer to ALL canonical rows for each raw skill
            to_link = []
            for s in skills_list:
                s_clean = s.strip() if isinstance(s, str) else str(s)
                for uid in skill_map.get(s_clean, []):
                    to_link.append((job_url, uid))

            if to_link:
                try:
                    await conn.executemany("""
                        INSERT INTO offer_skills (job_url, skill_id)
                        VALUES ($1, $2::uuid)
                        ON CONFLICT (job_url, skill_id) DO NOTHING
                    """, to_link)
                except Exception as e:
                    logging.error(f"Link error {job_url}: {e}")
                     
    logging.info("✅ Linking completed.")

async def run_normalization_process(stage: str = 'all'):
    dsn = get_database_dsn()
    conn = await asyncpg.connect(dsn=dsn)
    
    try:
        # Load environment variables for Bedrock
        session = boto3.Session(
            aws_access_key_id=os.getenv('AWS_BEDROCK_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('AWS_BEDROCK_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
        bedrock = session.client(service_name='bedrock-runtime')

        if stage in ['all', 'extract']:
            # 1. Extract Distinct (only if not skipping)
            await init_tables(conn)
            distinct_skills, skill_category_map = await extract_distinct_skills(conn)
            await conn.executemany("""
                INSERT INTO skills (original_skill_name, category)
                VALUES ($1, $2)
                ON CONFLICT (original_skill_name) DO NOTHING
            """, [(s, skill_category_map[s]) for s in distinct_skills])
            logging.info("✅ Distinct skills populated in DB.")

        if stage in ['all', 'normalize']:
            # 2 & 3. Normalize Loop
            while True:
                batch = await get_unnormalized_skills(conn, limit=50)
                if not batch:
                    logging.info("No more un-normalized skills.")
                    break
                    
                logging.info(f"Normalizing batch of {len(batch)} skills...")
                normalized_map = normalize_batch_with_ai(batch, bedrock)
                
                if normalized_map:
                    await update_canonical_names(conn, normalized_map)
                else:
                    logging.warning("Empty response from AI, stopping or skipping.")
                    break

        if stage in ['all', 'deduplicate']:
            # 5. Semantic Deduplication
            await deduplicate_canonical_skills(conn, bedrock)
                 
        if stage in ['all', 'link']:
            # 4. Link
            await link_offers_to_skills(conn)
        
    finally:
        await conn.close()

def main(stage: str = 'all'):
    return run_normalization_process(stage=stage)

if __name__ == "__main__":
    main()
