CREATE OR REPLACE VIEW offers_parsed AS WITH parsed_data AS (
        SELECT o.*,
            regexp_match(
                o.salary_any,
                '([0-9\s,.]+?)(?:[\s\n]*-[ \s\n]*([0-9\s,.]+))?[\s\n]*([A-Z]{3})[\s\n]*(Gross|Net)[\s\n]*per[\s\n]*(\w+)',
                'i'
            ) as m_any,
            regexp_match(
                o.salary_b2b,
                '([0-9\s,.]+?)(?:[\s\n]*-[ \s\n]*([0-9\s,.]+))?[\s\n]*([A-Z]{3})[\s\n]*(Gross|Net)[\s\n]*per[\s\n]*(\w+)',
                'i'
            ) as m_b2b,
            regexp_match(
                o.salary_permanent,
                '([0-9\s,.]+?)(?:[\s\n]*-[ \s\n]*([0-9\s,.]+))?[\s\n]*([A-Z]{3})[\s\n]*(Gross|Net)[\s\n]*per[\s\n]*(\w+)',
                'i'
            ) as m_perm,
            regexp_match(
                o.salary_internship,
                '([0-9\s,.]+?)(?:[\s\n]*-[ \s\n]*([0-9\s,.]+))?[\s\n]*([A-Z]{3})[\s\n]*(Gross|Net)[\s\n]*per[\s\n]*(\w+)',
                'i'
            ) as m_int,
            regexp_match(
                o.salary_mandate,
                '([0-9\s,.]+?)(?:[\s\n]*-[ \s\n]*([0-9\s,.]+))?[\s\n]*([A-Z]{3})[\s\n]*(Gross|Net)[\s\n]*per[\s\n]*(\w+)',
                'i'
            ) as m_man,
            regexp_match(
                o.salary_specific_task,
                '([0-9\s,.]+?)(?:[\s\n]*-[ \s\n]*([0-9\s,.]+))?[\s\n]*([A-Z]{3})[\s\n]*(Gross|Net)[\s\n]*per[\s\n]*(\w+)',
                'i'
            ) as m_task
        FROM public.offers o
    )
SELECT job_url,
    job_title,
    category,
    company,
    location,
    experience,
    employment_type,
    operating_mode,
    work_schedule,
    tech_stack,
    salary_any as salary_any_raw,
    salary_b2b as salary_b2b_raw,
    salary_permanent as salary_permanent_raw,
    salary_internship as salary_internship_raw,
    salary_mandate as salary_mandate_raw,
    salary_specific_task as salary_specific_task_raw,
    -- Parsed Any
    CAST(
        REPLACE(REPLACE(m_any [1], ' ', ''), ',', '') AS NUMERIC
    ) as salary_any_min,
    CAST(
        REPLACE(
            REPLACE(COALESCE(m_any [2], m_any [1]), ' ', ''),
            ',',
            ''
        ) AS NUMERIC
    ) as salary_any_max,
    m_any [3] as salary_any_currency,
    m_any [4] ILIKE 'Gross' as salary_any_is_gross,
    m_any [5] as salary_any_period,
    -- Parsed B2B
    CAST(
        REPLACE(REPLACE(m_b2b [1], ' ', ''), ',', '') AS NUMERIC
    ) as salary_b2b_min,
    CAST(
        REPLACE(
            REPLACE(COALESCE(m_b2b [2], m_b2b [1]), ' ', ''),
            ',',
            ''
        ) AS NUMERIC
    ) as salary_b2b_max,
    m_b2b [3] as salary_b2b_currency,
    m_b2b [4] ILIKE 'Gross' as salary_b2b_is_gross,
    m_b2b [5] as salary_b2b_period,
    -- Parsed Permanent
    CAST(
        REPLACE(REPLACE(m_perm [1], ' ', ''), ',', '') AS NUMERIC
    ) as salary_permanent_min,
    CAST(
        REPLACE(
            REPLACE(COALESCE(m_perm [2], m_perm [1]), ' ', ''),
            ',',
            ''
        ) AS NUMERIC
    ) as salary_permanent_max,
    m_perm [3] as salary_permanent_currency,
    m_perm [4] ILIKE 'Gross' as salary_permanent_is_gross,
    m_perm [5] as salary_permanent_period,
    -- Parsed Internship
    CAST(
        REPLACE(REPLACE(m_int [1], ' ', ''), ',', '') AS NUMERIC
    ) as salary_internship_min,
    CAST(
        REPLACE(
            REPLACE(COALESCE(m_int [2], m_int [1]), ' ', ''),
            ',',
            ''
        ) AS NUMERIC
    ) as salary_internship_max,
    m_int [3] as salary_internship_currency,
    m_int [4] ILIKE 'Gross' as salary_internship_is_gross,
    m_int [5] as salary_internship_period,
    -- Parsed Mandate
    CAST(
        REPLACE(REPLACE(m_man [1], ' ', ''), ',', '') AS NUMERIC
    ) as salary_mandate_min,
    CAST(
        REPLACE(
            REPLACE(COALESCE(m_man [2], m_man [1]), ' ', ''),
            ',',
            ''
        ) AS NUMERIC
    ) as salary_mandate_max,
    m_man [3] as salary_mandate_currency,
    m_man [4] ILIKE 'Gross' as salary_mandate_is_gross,
    m_man [5] as salary_mandate_period,
    -- Parsed Specific Task
    CAST(
        REPLACE(REPLACE(m_task [1], ' ', ''), ',', '') AS NUMERIC
    ) as salary_specific_task_min,
    CAST(
        REPLACE(
            REPLACE(COALESCE(m_task [2], m_task [1]), ' ', ''),
            ',',
            ''
        ) AS NUMERIC
    ) as salary_specific_task_max,
    m_task [3] as salary_specific_task_currency,
    m_task [4] ILIKE 'Gross' as salary_specific_task_is_gross,
    m_task [5] as salary_specific_task_period
FROM parsed_data;