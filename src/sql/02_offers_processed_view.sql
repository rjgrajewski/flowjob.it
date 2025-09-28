CREATE OR REPLACE VIEW offers_processed AS
WITH
    /*
    Source table containing job offers scraped from the job portal.
    */
    src AS (
        SELECT
            job_url
            , job_title
            , category
            , company
            , location
            , salary_any
            , salary_b2b
            , salary_internship
            , salary_mandate
            , salary_perm
            , salary_specific_task
            , work_type
            , experience
            , employment_type
            , operating_mode
            , tech_stack
        FROM public.offers
    )

    , split_types AS (
        SELECT
            job_url
            , job_title
            , category
            , company
            , CASE
                WHEN operating_mode = 'Remote' THEN 'Remote'
                ELSE location
            END AS location
            , salary_any
            , salary_b2b
            , salary_internship
            , salary_mandate
            , salary_perm
            , salary_specific_task
            , work_type
            , experience
            , REGEXP_SPLIT_TO_TABLE(employment_type, ',\s*') AS employment_type
            , operating_mode
            , tech_stack
        FROM src
        WHERE
            1=1
            AND src.job_url IS NOT NULL
            AND src.job_title IS NOT NULL
            AND src.category IS NOT NULL
            AND src.work_type IS NOT NULL
            AND src.experience IS NOT NULL
            AND src.employment_type IS NOT NULL
            AND src.operating_mode IS NOT NULL
            AND src.tech_stack IS NOT NULL
            AND src.job_url != 'N/A'
            AND src.job_title != 'N/A'
            AND src.category != 'N/A'
            AND src.work_type != 'N/A'
            AND src.experience != 'N/A'
            AND src.employment_type != 'N/A'
            AND src.operating_mode != 'N/A'
            AND src.tech_stack != 'N/A'
    )
    /*
    Splits the salary ranges into min and max values, and determines the frequency of salary (hourly, daily, monthly, yearly).
    Assumes that all the salaries are in PLN (Polish Zloty) and that the salary format is consistent.
    */
    , salaries_parsed AS (
        SELECT
            job_url
            , employment_type
            -- Extracts the minimum and maximum salary from the salary_any field.
            , CASE
                WHEN employment_type = 'Any'
                THEN 
                    CASE
                        WHEN salary_any ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_any, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_any ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_any, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_any ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_any, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_any ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_any, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_any_min
            , CASE
                WHEN employment_type = 'Any'
                THEN 
                    CASE
                        WHEN salary_any ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_any, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_any ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_any, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_any ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_any, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_any ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_any, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_any_max
            , CASE
                WHEN employment_type = 'B2B'
                THEN 
                    CASE
                        WHEN salary_b2b ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_b2b, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_b2b ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_b2b, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_b2b ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_b2b, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_b2b ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_b2b, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_b2b_min
            , CASE
                WHEN employment_type = 'B2B'
                THEN 
                    CASE
                        WHEN salary_b2b ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_b2b, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_b2b ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_b2b, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_b2b ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_b2b, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_b2b ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_b2b, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_b2b_max
            , CASE
                WHEN employment_type = 'Internship'
                THEN 
                    CASE
                        WHEN salary_internship ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_internship, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_internship ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_internship, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_internship ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_internship, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_internship ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_internship, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_internship_min
            , CASE
                WHEN employment_type = 'Internship'
                THEN 
                    CASE
                        WHEN salary_internship ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_internship, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_internship ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_internship, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_internship ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_internship, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_internship ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_internship, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_internship_max
            , CASE
                WHEN employment_type = 'Mandate'
                THEN 
                    CASE
                        WHEN salary_mandate ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_mandate, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_mandate ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_mandate, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_mandate ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_mandate, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_mandate ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_mandate, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_mandate_min
            , CASE
                WHEN employment_type = 'Mandate'
                THEN 
                    CASE
                        WHEN salary_mandate ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_mandate, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_mandate ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_mandate, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_mandate ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_mandate, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_mandate ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_mandate, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_mandate_max
            , CASE
                WHEN employment_type = 'Permanent'
                THEN 
                    CASE
                        WHEN salary_perm ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_perm, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_perm ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_perm, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_perm ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_perm, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_perm ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_perm, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_perm_min
            , CASE
                WHEN employment_type = 'Permanent'
                THEN 
                    CASE
                        WHEN salary_perm ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_perm, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_perm ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_perm, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_perm ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_perm, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_perm ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_perm, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_perm_max
            , CASE
                WHEN employment_type = 'Specific Task'
                THEN 
                    CASE
                        WHEN salary_specific_task ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_specific_task, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_specific_task ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_specific_task, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_specific_task ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_specific_task, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_specific_task ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_specific_task, '-', 1), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_specific_task_min
            , CASE
                WHEN employment_type = 'Specific Task'
                THEN 
                    CASE
                        WHEN salary_specific_task ILIKE '%/h' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_specific_task, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 8 * 20
                        WHEN salary_specific_task ILIKE '%/day' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_specific_task, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC * 20
                        WHEN salary_specific_task ILIKE '%/month' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_specific_task, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC
                        WHEN salary_specific_task ILIKE '%/year' THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(salary_specific_task, '-', 2), '[^0-9\.]', '', 'g'), '')::NUMERIC / 12
                        ELSE NULL
                    END
                ELSE NULL
            END AS salary_specific_task_max
        FROM split_types
    )

    , main AS (
        SELECT
            st.job_url
            , st.job_title
            , st.category
            , st.company
            , st.location
            , CASE
                WHEN st.employment_type = 'B2B' THEN sal.salary_b2b_min
                WHEN st.employment_type = 'Internship' THEN sal.salary_internship_min
                WHEN st.employment_type = 'Mandate' THEN sal.salary_mandate_min
                WHEN st.employment_type = 'Permanent' THEN sal.salary_perm_min
                WHEN st.employment_type = 'Specific Task' THEN sal.salary_specific_task_min
                ELSE sal.salary_any_min
            END AS salary_min
            , CASE
                WHEN st.employment_type = 'B2B'
                THEN CASE
                    WHEN sal.salary_b2b_max IS NOT NULL THEN sal.salary_b2b_max
                    ELSE sal.salary_b2b_min
                END
                WHEN st.employment_type = 'Internship'
                THEN CASE
                    WHEN sal.salary_internship_max IS NOT NULL THEN sal.salary_internship_max
                    ELSE sal.salary_internship_min
                END
                WHEN st.employment_type = 'Any'
                THEN CASE
                    WHEN sal.salary_any_max IS NOT NULL THEN sal.salary_any_max
                    ELSE sal.salary_any_min
                END
                WHEN st.employment_type = 'Mandate'
                THEN CASE
                    WHEN sal.salary_mandate_max IS NOT NULL THEN sal.salary_mandate_max
                    ELSE sal.salary_mandate_min
                END
                WHEN st.employment_type = 'Permanent'
                THEN CASE
                    WHEN sal.salary_perm_max IS NOT NULL THEN sal.salary_perm_max
                    ELSE sal.salary_perm_min
                END
                WHEN st.employment_type = 'Specific Task'
                THEN CASE
                    WHEN sal.salary_specific_task_max IS NOT NULL THEN sal.salary_specific_task_max
                    ELSE sal.salary_specific_task_min
                END
                ELSE sal.salary_any_max
            END AS salary_max
            , st.work_type
            , st.experience
            , st.employment_type
            , st.operating_mode
            , st.tech_stack
        FROM split_types st
        LEFT JOIN salaries_parsed sal 
            ON st.job_url = sal.job_url
            AND st.employment_type = sal.employment_type
        WHERE
            1=1
    )

SELECT *
FROM main