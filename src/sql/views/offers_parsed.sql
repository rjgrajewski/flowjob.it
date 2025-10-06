CREATE OR REPLACE VIEW offers_parsed AS
WITH
    /*
    Source table containing job offers scraped from the job portal.
    */
    offers AS (
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
            , salary_permanent
            , salary_specific_task
            , work_type
            , experience
            , employment_type
            , operating_mode
            , tech_stack
        FROM public.offers
    )
SELECT * FROM offers;

DROP VIEW offers_parsed;