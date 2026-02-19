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
                if skill_clean and len(skill_clean) < 100: # Basic sanity check
                    distinct_skills.add(skill_clean)
                    if skill_clean not in skill_category_map:
                         skill_category_map[skill_clean] = category
                         
        except Exception as e:
            logging.warning(f"Failed to parse tech_stack for {row['job_url']}: {e}")

    logging.info(f"👉 Found {len(distinct_skills)} distinct raw skills.")
    
    # Bulk insert (ignoring duplicates)
    insert_query = """
        INSERT INTO skills (original_skill_name, category)
        VALUES ($1, $2)
        ON CONFLICT (original_skill_name) DO NOTHING
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
        WHERE ai_normalized_name IS NULL
        LIMIT $1
    """
    rows = await conn.fetch(query, limit)
    return [dict(row) for row in rows]

def normalize_batch_with_ai(skills_data: List[Dict], bedrock_client) -> Dict[str, str]:
    """
    Step 3: Normalize a batch of skills using Bedrock.
    Returns: { "raw_skill": "Canonical Name" }
    """
    if not skills_data:
        return {}
        
    # Input map: Raw -> Category (Context)
    input_map = {s['original_skill_name']: s['category'] for s in skills_data}
    input_json = json.dumps(input_map, indent=2)
    
    prompt = f"""You are a technical data cleaner. Normalize these raw technical skills to their Canonical Names.

Input is a JSON object: {{ "Raw Name": "Category Constraints" }}
Output must be a JSON object: {{ "Raw Name": "Canonical Name" }}

Rules for Canonical Names:
1. **Granularity**: PRESERVE distinct technologies. 
   - "AWS" != "Azure" != "GCP". Do NOT merge them into "Cloud Platforms".
   - "React" != "Angular" != "Vue".
   - "Manual Testing" != "Automated Testing".
2. **Synonyms Only**: Merge ONLY when items are semantically IDENTICAL.
   - "React.js" -> "React"
   - "Amazon Web Services" -> "AWS"
   - "NodeJS" -> "Node.js"
3. **Context**: Use Category to disambiguate (e.g. "Go" in "Game" -> "Go", "Go" in "Backend" -> "Go").
4. **Formatting**: Use standard capitalization (e.g. "iOS", "PostgreSQL").

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

async def update_canonical_names(conn: asyncpg.Connection, mapping: Dict[str, str]):
    """Update the skills table with normalized names."""
    if not mapping: return
    
    query = """
        UPDATE skills 
        SET ai_normalized_name = $2
        WHERE original_skill_name = $1
    """
    batch = list(mapping.items())
    await conn.executemany(query, batch)
    logging.info(f"✅ Updated {len(batch)} skills with canonical names.")

async def deduplicate_canonical_skills(conn: asyncpg.Connection, bedrock_client):
    """
    Step 5: Semantic Deduplication.
    Clusters canonical names to merge synonyms (e.g. "AI assistants" -> "AI Code Assistants").
    """
    logging.info("🧠 Starting Semantic Deduplication...")
    
    # 1. Fetch all DISTINCT canonical names
    rows = await conn.fetch("SELECT DISTINCT ai_normalized_name FROM skills WHERE ai_normalized_name IS NOT NULL")
    canonicals = [r['ai_normalized_name'] for r in rows]
    
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
        # We just need to update `ai_normalized_name` where it matches the old one.
        
        update_query = """
            UPDATE skills 
            SET ai_normalized_name = $1 
            WHERE ai_normalized_name = $2
        """
        
        batch = [(new, old) for old, new in updates.items()]
        await conn.executemany(update_query, batch)
        logging.info("✅ Semantic deduplication applied.")

async def link_offers_to_skills(conn: asyncpg.Connection):
    """
    Step 4: Link offers to skills based on text match.
    This replaces the 'extraction' phase for every offer. We just match what we have.
    """
    logging.info("🔗 Linking offers to skills...")
    
    # This might be heavy if done in one go. 
    # Let's process offers in batches.
    
    # First, load ALL skills into memory map: raw_name -> skill_id
    # Assuming distinct skills count is manageable (e.g. < 5000)
    skill_rows = await conn.fetch("SELECT original_skill_name, uuid FROM skills")
    skill_map = {row['original_skill_name']: row['uuid'] for row in skill_rows}
    
    logging.info(f"Loaded {len(skill_map)} skills for linking.")
    
    # Process offers
    # We select offers that don't have links yet? Or just all?
    # To be safe/idempotent, we can select all.
    query = "SELECT job_url, tech_stack FROM offers WHERE tech_stack IS NOT NULL"
    
    # Cursor for memory efficiency
    async with conn.transaction():
        async for row in conn.cursor(query):
            job_url = row['job_url']
            tech_stack = row['tech_stack']
            
            # Parse stack
            try:
                if isinstance(tech_stack, str):
                    try:
                        skills_list = json.loads(tech_stack)
                    except:
                        skills_list = [s.strip() for s in tech_stack.split(',')]
                elif isinstance(tech_stack, list):
                    skills_list = tech_stack
                else:
                    skills_list = []
            except:
                skills_list = []
                
            # Find IDs
            to_link = []
            for s in skills_list:
                s_clean = s.strip() if isinstance(s, str) else str(s)
                if s_clean in skill_map:
                    to_link.append((job_url, skill_map[s_clean]))
            
            # Insert links
            if to_link:
                # We can't use executemany inside async cursor loop easily without breaking cursor?
                # Actually we can.
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
