-- ============================================================
--  REFORMULATION-UI  |  SQL SERVER SCHEMA
--  Database : DOLOXE  (Azure SQL / SQL Server 2019+)
--  Prefix   : reform_   (namespaces all objects cleanly)
-- ============================================================

USE [DOLOXE];
GO

-- ============================================================
--  SECTION 1 : LOOKUP / REFERENCE TABLES
-- ============================================================

-- 1A. Route of Administration
IF OBJECT_ID('dbo.reform_ref_roa','U') IS NULL
CREATE TABLE [dbo].[reform_ref_roa] (
    [roa_id]   SMALLINT      NOT NULL IDENTITY(1,1),
    [roa_name] NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_reform_ref_roa        PRIMARY KEY ([roa_id]),
    CONSTRAINT UQ_reform_ref_roa_name   UNIQUE      ([roa_name])
);
GO

-- 1B. Dosage Form
IF OBJECT_ID('dbo.reform_ref_dosage_form','U') IS NULL
CREATE TABLE [dbo].[reform_ref_dosage_form] (
    [dosage_form_id]   SMALLINT      NOT NULL IDENTITY(1,1),
    [dosage_form_name] NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_reform_ref_dosage_form      PRIMARY KEY ([dosage_form_id]),
    CONSTRAINT UQ_reform_ref_dosage_form_name UNIQUE      ([dosage_form_name])
);
GO

-- 1C. Molecule Type
IF OBJECT_ID('dbo.reform_ref_molecule_type','U') IS NULL
CREATE TABLE [dbo].[reform_ref_molecule_type] (
    [molecule_type_id]   SMALLINT      NOT NULL IDENTITY(1,1),
    [molecule_type_name] NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_reform_ref_molecule_type      PRIMARY KEY ([molecule_type_id]),
    CONSTRAINT UQ_reform_ref_molecule_type_name UNIQUE      ([molecule_type_name])
);
GO

-- 1D. Disease Area
IF OBJECT_ID('dbo.reform_ref_disease_area','U') IS NULL
CREATE TABLE [dbo].[reform_ref_disease_area] (
    [disease_area_id]   SMALLINT      NOT NULL IDENTITY(1,1),
    [disease_area_name] NVARCHAR(200) NOT NULL,
    CONSTRAINT PK_reform_ref_disease_area      PRIMARY KEY ([disease_area_id]),
    CONSTRAINT UQ_reform_ref_disease_area_name UNIQUE      ([disease_area_name])
);
GO


-- ============================================================
--  SECTION 2 : CORE DIMENSION TABLES
-- ============================================================

-- 2A. Molecule Master  (one row per unique drug / active substance)
IF OBJECT_ID('dbo.reform_dim_molecule','U') IS NULL
CREATE TABLE [dbo].[reform_dim_molecule] (
    [molecule_id]      INT           NOT NULL IDENTITY(1,1),
    [research_code]    NVARCHAR(50)  NULL,                      -- e.g. RC-2041
    [generic_name]     NVARCHAR(300) NOT NULL,
    [brand_name]       NVARCHAR(300) NULL,
    [nda_number]       NVARCHAR(20)  NULL,                      -- Orange Book NDA
    [molecule_type_id] SMALLINT      NULL,
    [innovation_type]  NVARCHAR(10)  NULL
        CONSTRAINT CK_molecule_innovation CHECK ([innovation_type] IN ('NME','Non-NME')),
    [disease_area_id]  SMALLINT      NULL,
    [indication]       NVARCHAR(500) NULL,                      -- free-text indication
    [sponsor_company]  NVARCHAR(300) NULL,
    [approval_date]    DATE          NULL,
    [is_rare_disease]  BIT           NOT NULL DEFAULT 0,
    [created_at]       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    [updated_at]       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_reform_dim_molecule        PRIMARY KEY ([molecule_id]),
    CONSTRAINT FK_molecule_molecule_type     FOREIGN KEY ([molecule_type_id])
        REFERENCES [dbo].[reform_ref_molecule_type] ([molecule_type_id]),
    CONSTRAINT FK_molecule_disease_area      FOREIGN KEY ([disease_area_id])
        REFERENCES [dbo].[reform_ref_disease_area]  ([disease_area_id])
);
GO


-- ============================================================
--  SECTION 3 : FACT TABLES
-- ============================================================

-- 3A. Candidate
--     One row per molecule × opportunity_type × target-form combination.
--     A single molecule can appear as Reformulation AND Repurpose AND First-To-File.
IF OBJECT_ID('dbo.reform_fact_candidate','U') IS NULL
CREATE TABLE [dbo].[reform_fact_candidate] (
    [candidate_id]            INT           NOT NULL IDENTITY(1,1),
    [molecule_id]             INT           NOT NULL,
    [opportunity_type]        NVARCHAR(20)  NOT NULL
        CONSTRAINT CK_candidate_opp_type CHECK ([opportunity_type] IN ('Reformulation','Repurpose','First-To-File')),
    [regulatory_pathway]      NVARCHAR(100) NULL,               -- e.g. '505(b)(2)', 'ANDA Para IV'
    [roa_original_id]         SMALLINT      NULL,               -- current approved ROA
    [roa_target_id]           SMALLINT      NULL,               -- proposed new ROA
    [dosage_form_original_id] SMALLINT      NULL,               -- current dosage form
    [dosage_form_target_id]   SMALLINT      NULL,               -- proposed dosage form
    [opportunity_score]       DECIMAL(5,2)  NULL
        CONSTRAINT CK_candidate_score CHECK ([opportunity_score] BETWEEN 0 AND 100),
    [is_505b2_candidate]      BIT           NOT NULL DEFAULT 0,
    [is_ftf_anda_candidate]   BIT           NOT NULL DEFAULT 0,
    [is_rare_disease_focus]   BIT           NOT NULL DEFAULT 0,
    [litigation_status]       NVARCHAR(3)   NULL
        CONSTRAINT CK_candidate_litigation CHECK ([litigation_status] IN ('Yes','No')),
    [created_at]              DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    [updated_at]              DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_reform_fact_candidate          PRIMARY KEY ([candidate_id]),
    CONSTRAINT FK_candidate_molecule             FOREIGN KEY ([molecule_id])
        REFERENCES [dbo].[reform_dim_molecule]       ([molecule_id]),
    CONSTRAINT FK_candidate_roa_original         FOREIGN KEY ([roa_original_id])
        REFERENCES [dbo].[reform_ref_roa]            ([roa_id]),
    CONSTRAINT FK_candidate_roa_target           FOREIGN KEY ([roa_target_id])
        REFERENCES [dbo].[reform_ref_roa]            ([roa_id]),
    CONSTRAINT FK_candidate_dosage_form_original FOREIGN KEY ([dosage_form_original_id])
        REFERENCES [dbo].[reform_ref_dosage_form]    ([dosage_form_id]),
    CONSTRAINT FK_candidate_dosage_form_target   FOREIGN KEY ([dosage_form_target_id])
        REFERENCES [dbo].[reform_ref_dosage_form]    ([dosage_form_id])
);
GO

-- 3B. Patent  (multiple patents per molecule)
IF OBJECT_ID('dbo.reform_fact_patent','U') IS NULL
CREATE TABLE [dbo].[reform_fact_patent] (
    [patent_id]          INT          NOT NULL IDENTITY(1,1),
    [molecule_id]        INT          NOT NULL,
    [patent_number]      NVARCHAR(50) NOT NULL,
    [patent_expiry_date] DATE         NULL,
    [exclusivity_code]   NVARCHAR(20) NULL,                    -- e.g. NCE, ODE, PED
    [created_at]         DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_reform_fact_patent    PRIMARY KEY ([patent_id]),
    CONSTRAINT FK_patent_molecule       FOREIGN KEY ([molecule_id])
        REFERENCES [dbo].[reform_dim_molecule] ([molecule_id])
);
GO

-- 3C. ANDA Filer  (multiple filers per molecule)
IF OBJECT_ID('dbo.reform_fact_anda_filer','U') IS NULL
CREATE TABLE [dbo].[reform_fact_anda_filer] (
    [filer_id]           INT           NOT NULL IDENTITY(1,1),
    [molecule_id]        INT           NOT NULL,
    [company_name]       NVARCHAR(300) NOT NULL,
    [first_to_file_flag] BIT           NOT NULL DEFAULT 0,
    [para_iv_flag]       BIT           NOT NULL DEFAULT 0,
    [litigation_status]  NVARCHAR(100) NULL,                   -- e.g. 'Paragraph IV', 'Settled'
    [filing_date]        DATE          NULL,
    [created_at]         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_reform_fact_anda_filer PRIMARY KEY ([filer_id]),
    CONSTRAINT FK_anda_filer_molecule    FOREIGN KEY ([molecule_id])
        REFERENCES [dbo].[reform_dim_molecule] ([molecule_id])
);
GO

-- 3D. Sales  (one row per molecule per fiscal year)
IF OBJECT_ID('dbo.reform_fact_sales','U') IS NULL
CREATE TABLE [dbo].[reform_fact_sales] (
    [sales_id]            INT           NOT NULL IDENTITY(1,1),
    [molecule_id]         INT           NOT NULL,
    [fy_year]             SMALLINT      NOT NULL,              -- fiscal year e.g. 2024
    [sales_us_usdm]       DECIMAL(12,2) NULL,                 -- US sales USD millions
    [sales_eu_usdm]       DECIMAL(12,2) NULL,
    [sales_row_usdm]      DECIMAL(12,2) NULL,                 -- Rest of World
    [sales_global_usdm]   DECIMAL(12,2) NULL,
    [created_at]          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_reform_fact_sales          PRIMARY KEY ([sales_id]),
    CONSTRAINT FK_sales_molecule             FOREIGN KEY ([molecule_id])
        REFERENCES [dbo].[reform_dim_molecule] ([molecule_id]),
    CONSTRAINT UQ_reform_fact_sales_mol_year UNIQUE ([molecule_id], [fy_year])
);
GO

-- 3E. Strategy  (AI-generated per candidate, versioned by created_at)
IF OBJECT_ID('dbo.reform_fact_strategy','U') IS NULL
CREATE TABLE [dbo].[reform_fact_strategy] (
    [strategy_id]  INT            NOT NULL IDENTITY(1,1),
    [candidate_id] INT            NOT NULL,
    [summary_text] NVARCHAR(MAX)  NULL,
    [scientific]   NVARCHAR(MAX)  NULL,
    [technology]   NVARCHAR(MAX)  NULL,
    [commercial]   NVARCHAR(MAX)  NULL,
    [patient]      NVARCHAR(MAX)  NULL,
    [regulatory]   NVARCHAR(MAX)  NULL,
    [generated_by] NVARCHAR(100)  NOT NULL DEFAULT 'AI',
    [created_at]   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_reform_fact_strategy  PRIMARY KEY ([strategy_id]),
    CONSTRAINT FK_strategy_candidate    FOREIGN KEY ([candidate_id])
        REFERENCES [dbo].[reform_fact_candidate] ([candidate_id])
);
GO

-- 3F. Bridging Study  (child of strategy)
IF OBJECT_ID('dbo.reform_fact_bridging_study','U') IS NULL
CREATE TABLE [dbo].[reform_fact_bridging_study] (
    [study_id]          INT           NOT NULL IDENTITY(1,1),
    [strategy_id]       INT           NOT NULL,
    [study_description] NVARCHAR(500) NOT NULL,
    [sort_order]        TINYINT       NOT NULL DEFAULT 0,

    CONSTRAINT PK_reform_fact_bridging_study PRIMARY KEY ([study_id]),
    CONSTRAINT FK_bridging_study_strategy    FOREIGN KEY ([strategy_id])
        REFERENCES [dbo].[reform_fact_strategy] ([strategy_id])
);
GO

-- 3G. Reference / Evidence  (child of strategy)
IF OBJECT_ID('dbo.reform_fact_reference','U') IS NULL
CREATE TABLE [dbo].[reform_fact_reference] (
    [reference_id] INT           NOT NULL IDENTITY(1,1),
    [strategy_id]  INT           NOT NULL,
    [category]     NVARCHAR(50)  NOT NULL
        CONSTRAINT CK_reference_category CHECK ([category] IN ('Clinical','Regulatory','Preclinical','Commercial')),
    [description]  NVARCHAR(MAX) NOT NULL,
    [source]       NVARCHAR(500) NOT NULL,
    [created_at]   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_reform_fact_reference  PRIMARY KEY ([reference_id]),
    CONSTRAINT FK_reference_strategy     FOREIGN KEY ([strategy_id])
        REFERENCES [dbo].[reform_fact_strategy] ([strategy_id])
);
GO


-- ============================================================
--  SECTION 4 : AUDIT TABLES
-- ============================================================

-- 4A. Search / Filter Log  (every /api/candidates call is recorded)
IF OBJECT_ID('dbo.reform_audit_search_log','U') IS NULL
CREATE TABLE [dbo].[reform_audit_search_log] (
    [log_id]           BIGINT        NOT NULL IDENTITY(1,1),
    [search_timestamp] DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    [opportunity_type] NVARCHAR(20)  NULL,
    [filters_json]     NVARCHAR(MAX) NULL,      -- full filter payload as JSON for debugging
    [result_count]     INT           NULL,
    [ip_address]       NVARCHAR(50)  NULL,
    [user_agent]       NVARCHAR(500) NULL,

    CONSTRAINT PK_reform_audit_search_log PRIMARY KEY ([log_id])
);
GO

-- 4B. Opportunity Score Change History  (triggered automatically)
IF OBJECT_ID('dbo.reform_audit_score_history','U') IS NULL
CREATE TABLE [dbo].[reform_audit_score_history] (
    [audit_id]     BIGINT        NOT NULL IDENTITY(1,1),
    [candidate_id] INT           NOT NULL,
    [old_score]    DECIMAL(5,2)  NULL,
    [new_score]    DECIMAL(5,2)  NULL,
    [changed_at]   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    [changed_by]   NVARCHAR(100) NULL,

    CONSTRAINT PK_reform_audit_score_history PRIMARY KEY ([audit_id])
);
GO


-- ============================================================
--  SECTION 5 : INDEXES
-- ============================================================

-- dim_molecule  ──────────────────────────────────────────────
CREATE INDEX IX_mol_generic_name    ON [dbo].[reform_dim_molecule] ([generic_name]);
CREATE INDEX IX_mol_brand_name      ON [dbo].[reform_dim_molecule] ([brand_name]);
CREATE INDEX IX_mol_research_code   ON [dbo].[reform_dim_molecule] ([research_code]);
CREATE INDEX IX_mol_approval_date   ON [dbo].[reform_dim_molecule] ([approval_date]);
CREATE INDEX IX_mol_innovation      ON [dbo].[reform_dim_molecule] ([innovation_type]);
CREATE INDEX IX_mol_disease_area    ON [dbo].[reform_dim_molecule] ([disease_area_id]);
GO

-- fact_candidate  ────────────────────────────────────────────
CREATE INDEX IX_cand_molecule       ON [dbo].[reform_fact_candidate] ([molecule_id]);
CREATE INDEX IX_cand_opp_type       ON [dbo].[reform_fact_candidate] ([opportunity_type]);
CREATE INDEX IX_cand_score_desc     ON [dbo].[reform_fact_candidate] ([opportunity_score] DESC);
CREATE INDEX IX_cand_litigation     ON [dbo].[reform_fact_candidate] ([litigation_status]);

-- Covering index for the main candidate list query (filters most commonly combined)
CREATE INDEX IX_cand_covering
    ON [dbo].[reform_fact_candidate]
    ([opportunity_type], [roa_original_id], [dosage_form_original_id], [litigation_status])
    INCLUDE ([candidate_id], [molecule_id], [opportunity_score],
             [is_505b2_candidate], [is_ftf_anda_candidate],
             [is_rare_disease_focus], [regulatory_pathway]);
GO

-- fact_patent  ───────────────────────────────────────────────
CREATE INDEX IX_pat_molecule        ON [dbo].[reform_fact_patent] ([molecule_id]);
CREATE INDEX IX_pat_expiry          ON [dbo].[reform_fact_patent] ([patent_expiry_date]);
GO

-- fact_anda_filer  ───────────────────────────────────────────
CREATE INDEX IX_anda_molecule       ON [dbo].[reform_fact_anda_filer] ([molecule_id]);
-- Filtered index: only Para IV rows (common query target)
CREATE INDEX IX_anda_para_iv
    ON [dbo].[reform_fact_anda_filer] ([molecule_id])
    WHERE [para_iv_flag] = 1;
GO

-- fact_sales  ────────────────────────────────────────────────
CREATE INDEX IX_sales_mol_year      ON [dbo].[reform_fact_sales] ([molecule_id], [fy_year]);
CREATE INDEX IX_sales_year          ON [dbo].[reform_fact_sales] ([fy_year]);
GO

-- fact_strategy  ─────────────────────────────────────────────
CREATE INDEX IX_strat_candidate     ON [dbo].[reform_fact_strategy] ([candidate_id], [created_at] DESC);
GO

-- fact_bridging_study  ───────────────────────────────────────
CREATE INDEX IX_study_strategy_ord  ON [dbo].[reform_fact_bridging_study] ([strategy_id], [sort_order]);
GO

-- fact_reference  ────────────────────────────────────────────
CREATE INDEX IX_ref_strategy_cat    ON [dbo].[reform_fact_reference] ([strategy_id], [category]);
GO

-- audit_search_log  ──────────────────────────────────────────
CREATE INDEX IX_log_timestamp       ON [dbo].[reform_audit_search_log] ([search_timestamp] DESC);
CREATE INDEX IX_log_opp_type        ON [dbo].[reform_audit_search_log] ([opportunity_type]);
GO


-- ============================================================
--  SECTION 6 : TRIGGERS
-- ============================================================

-- T1. Auto-update updated_at on reform_fact_candidate
CREATE OR ALTER TRIGGER [dbo].[trg_reform_candidate_UpdatedAt]
ON [dbo].[reform_fact_candidate]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE c
    SET    c.[updated_at] = SYSUTCDATETIME()
    FROM   [dbo].[reform_fact_candidate] c
    INNER JOIN inserted i ON c.[candidate_id] = i.[candidate_id];
END;
GO

-- T2. Auto-update updated_at on reform_dim_molecule
CREATE OR ALTER TRIGGER [dbo].[trg_reform_molecule_UpdatedAt]
ON [dbo].[reform_dim_molecule]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE m
    SET    m.[updated_at] = SYSUTCDATETIME()
    FROM   [dbo].[reform_dim_molecule] m
    INNER JOIN inserted i ON m.[molecule_id] = i.[molecule_id];
END;
GO

-- T3. Audit every opportunity_score change into history table
CREATE OR ALTER TRIGGER [dbo].[trg_reform_candidate_ScoreAudit]
ON [dbo].[reform_fact_candidate]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- Only fire when opportunity_score actually changed
    INSERT INTO [dbo].[reform_audit_score_history]
        ([candidate_id], [old_score], [new_score], [changed_at])
    SELECT
        d.[candidate_id],
        d.[opportunity_score],
        i.[opportunity_score],
        SYSUTCDATETIME()
    FROM   deleted  d
    INNER JOIN inserted i ON d.[candidate_id] = i.[candidate_id]
    WHERE  ISNULL(d.[opportunity_score], -1) <> ISNULL(i.[opportunity_score], -1);
END;
GO


-- ============================================================
--  SECTION 7 : STORED PROCEDURES
-- ============================================================

-- SP-1  GetOptions
--       Returns ROA list + Dosage Form list (two result sets)
--       Called by : GET /api/options
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_reform_GetOptions]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [roa_name]
    FROM   [dbo].[reform_ref_roa]
    ORDER BY [roa_name];

    SELECT [dosage_form_name]
    FROM   [dbo].[reform_ref_dosage_form]
    ORDER BY [dosage_form_name];
END;
GO


-- SP-2  GetCandidates
--       Accepts all UI filter parameters (all nullable = optional).
--       Called by : GET /api/candidates?...
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_reform_GetCandidates]
    @opportunity_type    NVARCHAR(20)  = NULL,
    @research_code       NVARCHAR(50)  = NULL,
    @generic_name        NVARCHAR(300) = NULL,
    @brand_name          NVARCHAR(300) = NULL,
    @molecule_type       NVARCHAR(100) = NULL,
    @disease_area        NVARCHAR(200) = NULL,
    @indication          NVARCHAR(500) = NULL,
    @innovation          NVARCHAR(10)  = NULL,
    @roa                 NVARCHAR(100) = NULL,
    @dosage_form         NVARCHAR(100) = NULL,
    @approval_date       DATE          = NULL,
    @litigation_status   NVARCHAR(3)   = NULL,
    @patent_expiry_from  DATE          = NULL,
    @patent_expiry_to    DATE          = NULL,
    @sales_us_from       DECIMAL(12,2) = NULL,
    @sales_us_to         DECIMAL(12,2) = NULL,
    @sales_eu_from       DECIMAL(12,2) = NULL,
    @sales_eu_to         DECIMAL(12,2) = NULL,
    @sales_row_from      DECIMAL(12,2) = NULL,
    @sales_row_to        DECIMAL(12,2) = NULL,
    @sales_global_from   DECIMAL(12,2) = NULL,
    @sales_global_to     DECIMAL(12,2) = NULL,
    @fy_year             SMALLINT      = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Pre-compute patent-range molecule set (avoids correlated subquery per row)
    DECLARE @patent_filter_active BIT = 0;
    IF @patent_expiry_from IS NOT NULL OR @patent_expiry_to IS NOT NULL
        SET @patent_filter_active = 1;

    -- Pre-compute sales-range molecule set
    DECLARE @sales_filter_active BIT = 0;
    IF @fy_year IS NOT NULL
        OR @sales_us_from IS NOT NULL OR @sales_us_to IS NOT NULL
        OR @sales_eu_from IS NOT NULL OR @sales_eu_to IS NOT NULL
        OR @sales_row_from IS NOT NULL OR @sales_row_to IS NOT NULL
        OR @sales_global_from IS NOT NULL OR @sales_global_to IS NOT NULL
        SET @sales_filter_active = 1;

    SELECT
        c.[candidate_id],
        m.[research_code],
        m.[generic_name],
        m.[brand_name],
        r_orig.[roa_name]            AS [route_of_administration],
        df_orig.[dosage_form_name]   AS [dosage_form],
        c.[opportunity_type],
        c.[regulatory_pathway],
        c.[opportunity_score],
        c.[is_505b2_candidate],
        c.[is_ftf_anda_candidate],
        c.[is_rare_disease_focus],
        c.[litigation_status]
    FROM      [dbo].[reform_fact_candidate]      c
    JOIN      [dbo].[reform_dim_molecule]         m
                ON m.[molecule_id]         = c.[molecule_id]
    LEFT JOIN [dbo].[reform_ref_roa]              r_orig
                ON r_orig.[roa_id]         = c.[roa_original_id]
    LEFT JOIN [dbo].[reform_ref_dosage_form]      df_orig
                ON df_orig.[dosage_form_id]= c.[dosage_form_original_id]
    LEFT JOIN [dbo].[reform_ref_molecule_type]    mt
                ON mt.[molecule_type_id]   = m.[molecule_type_id]
    LEFT JOIN [dbo].[reform_ref_disease_area]     da
                ON da.[disease_area_id]    = m.[disease_area_id]
    -- Patent expiry range sub-join (only computed when filter active)
    LEFT JOIN (
        SELECT DISTINCT [molecule_id]
        FROM   [dbo].[reform_fact_patent]
        WHERE  (@patent_filter_active = 0)
            OR (  (@patent_expiry_from IS NULL OR [patent_expiry_date] >= @patent_expiry_from)
              AND (@patent_expiry_to   IS NULL OR [patent_expiry_date] <= @patent_expiry_to)  )
    ) pat ON pat.[molecule_id] = m.[molecule_id]
    -- Sales range sub-join
    LEFT JOIN (
        SELECT DISTINCT [molecule_id]
        FROM   [dbo].[reform_fact_sales]
        WHERE  (@sales_filter_active = 0)
            OR (  (@fy_year            IS NULL OR [fy_year]           = @fy_year)
              AND (@sales_us_from      IS NULL OR [sales_us_usdm]    >= @sales_us_from)
              AND (@sales_us_to        IS NULL OR [sales_us_usdm]    <= @sales_us_to)
              AND (@sales_eu_from      IS NULL OR [sales_eu_usdm]    >= @sales_eu_from)
              AND (@sales_eu_to        IS NULL OR [sales_eu_usdm]    <= @sales_eu_to)
              AND (@sales_row_from     IS NULL OR [sales_row_usdm]   >= @sales_row_from)
              AND (@sales_row_to       IS NULL OR [sales_row_usdm]   <= @sales_row_to)
              AND (@sales_global_from  IS NULL OR [sales_global_usdm]>= @sales_global_from)
              AND (@sales_global_to    IS NULL OR [sales_global_usdm]<= @sales_global_to)  )
    ) sal ON sal.[molecule_id] = m.[molecule_id]
    WHERE
        (@opportunity_type  IS NULL OR c.[opportunity_type]        =     @opportunity_type)
    AND (@research_code     IS NULL OR m.[research_code]       LIKE '%' + @research_code  + '%')
    AND (@generic_name      IS NULL OR m.[generic_name]        LIKE '%' + @generic_name   + '%')
    AND (@brand_name        IS NULL OR m.[brand_name]          LIKE '%' + @brand_name     + '%')
    AND (@molecule_type     IS NULL OR mt.[molecule_type_name]     =     @molecule_type)
    AND (@disease_area      IS NULL OR da.[disease_area_name]  LIKE '%' + @disease_area   + '%')
    AND (@indication        IS NULL OR m.[indication]          LIKE '%' + @indication     + '%')
    AND (@innovation        IS NULL OR m.[innovation_type]         =     @innovation)
    AND (@roa               IS NULL OR r_orig.[roa_name]           =     @roa)
    AND (@dosage_form       IS NULL OR df_orig.[dosage_form_name]  =     @dosage_form)
    AND (@approval_date     IS NULL OR m.[approval_date]          >=     @approval_date)
    AND (@litigation_status IS NULL OR c.[litigation_status]       =     @litigation_status)
    AND (@patent_filter_active = 0  OR pat.[molecule_id] IS NOT NULL)
    AND (@sales_filter_active  = 0  OR sal.[molecule_id] IS NOT NULL)
    ORDER BY c.[opportunity_score] DESC;
END;
GO


-- SP-3  GetDrugProfile
--       Returns 4 result sets: profile, patents, ANDA filers, sales
--       Called by : GET /api/drug/{candidate_id}
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_reform_GetDrugProfile]
    @candidate_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1 : Main profile row
    SELECT
        c.[candidate_id],
        m.[research_code],
        m.[generic_name],
        m.[brand_name],
        m.[nda_number],
        m.[indication]             AS [indication_original],
        m.[sponsor_company],
        m.[approval_date],
        m.[innovation_type],
        m.[is_rare_disease],
        c.[regulatory_pathway],
        c.[opportunity_type],
        c.[opportunity_score],
        c.[is_505b2_candidate],
        c.[is_ftf_anda_candidate],
        c.[is_rare_disease_focus],
        c.[litigation_status],
        r_orig.[roa_name]            AS [route_of_administration_original],
        r_tgt.[roa_name]             AS [route_of_administration_new],
        df_orig.[dosage_form_name]   AS [dosage_form_original],
        df_tgt.[dosage_form_name]    AS [dosage_form_new],
        da.[disease_area_name]       AS [disease_area],
        mt.[molecule_type_name]      AS [molecule_type]
    FROM      [dbo].[reform_fact_candidate]      c
    JOIN      [dbo].[reform_dim_molecule]         m
                ON m.[molecule_id]          = c.[molecule_id]
    LEFT JOIN [dbo].[reform_ref_roa]              r_orig
                ON r_orig.[roa_id]          = c.[roa_original_id]
    LEFT JOIN [dbo].[reform_ref_roa]              r_tgt
                ON r_tgt.[roa_id]           = c.[roa_target_id]
    LEFT JOIN [dbo].[reform_ref_dosage_form]      df_orig
                ON df_orig.[dosage_form_id] = c.[dosage_form_original_id]
    LEFT JOIN [dbo].[reform_ref_dosage_form]      df_tgt
                ON df_tgt.[dosage_form_id]  = c.[dosage_form_target_id]
    LEFT JOIN [dbo].[reform_ref_disease_area]     da
                ON da.[disease_area_id]     = m.[disease_area_id]
    LEFT JOIN [dbo].[reform_ref_molecule_type]    mt
                ON mt.[molecule_type_id]    = m.[molecule_type_id]
    WHERE c.[candidate_id] = @candidate_id;

    -- Result set 2 : Patents
    SELECT
        p.[patent_number],
        CONVERT(NVARCHAR(10), p.[patent_expiry_date], 23) AS [patent_expiry_date],
        p.[exclusivity_code]
    FROM      [dbo].[reform_fact_patent]     p
    JOIN      [dbo].[reform_fact_candidate]  c ON c.[molecule_id] = p.[molecule_id]
    WHERE c.[candidate_id] = @candidate_id
    ORDER BY  p.[patent_expiry_date];

    -- Result set 3 : ANDA Filers
    SELECT
        a.[company_name],
        a.[first_to_file_flag],
        a.[para_iv_flag],
        a.[litigation_status],
        CONVERT(NVARCHAR(10), a.[filing_date], 23) AS [filing_date]
    FROM      [dbo].[reform_fact_anda_filer] a
    JOIN      [dbo].[reform_fact_candidate]  c ON c.[molecule_id] = a.[molecule_id]
    WHERE c.[candidate_id] = @candidate_id
    ORDER BY  a.[first_to_file_flag] DESC, a.[filing_date];

    -- Result set 4 : Sales history
    SELECT
        s.[fy_year],
        s.[sales_us_usdm],
        s.[sales_eu_usdm],
        s.[sales_row_usdm],
        s.[sales_global_usdm]
    FROM      [dbo].[reform_fact_sales]      s
    JOIN      [dbo].[reform_fact_candidate]  c ON c.[molecule_id] = s.[molecule_id]
    WHERE c.[candidate_id] = @candidate_id
    ORDER BY  s.[fy_year];
END;
GO


-- SP-4  GetStrategy
--       Returns 3 result sets: strategy, bridging studies, references
--       Called by : GET /api/strategy/{candidate_id}
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_reform_GetStrategy]
    @candidate_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Latest strategy (versioned by created_at)
    SELECT TOP 1
        s.[strategy_id],
        s.[summary_text],
        s.[scientific],
        s.[technology],
        s.[commercial],
        s.[patient],
        s.[regulatory],
        s.[generated_by],
        s.[created_at]
    FROM  [dbo].[reform_fact_strategy] s
    WHERE s.[candidate_id] = @candidate_id
    ORDER BY s.[created_at] DESC;

    -- Bridging studies for that strategy
    SELECT
        b.[study_description],
        b.[sort_order]
    FROM  [dbo].[reform_fact_bridging_study] b
    WHERE b.[strategy_id] = (
        SELECT TOP 1 [strategy_id]
        FROM   [dbo].[reform_fact_strategy]
        WHERE  [candidate_id] = @candidate_id
        ORDER BY [created_at] DESC
    )
    ORDER BY b.[sort_order];

    -- References for that strategy
    SELECT
        r.[category],
        r.[description],
        r.[source]
    FROM  [dbo].[reform_fact_reference] r
    WHERE r.[strategy_id] = (
        SELECT TOP 1 [strategy_id]
        FROM   [dbo].[reform_fact_strategy]
        WHERE  [candidate_id] = @candidate_id
        ORDER BY [created_at] DESC
    )
    ORDER BY r.[category], r.[reference_id];
END;
GO


-- SP-5  SaveStrategy
--       Insert a new strategy version + its studies + references.
--       Called by the AI strategy generator (internal).
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_reform_SaveStrategy]
    @candidate_id         INT,
    @summary_text         NVARCHAR(MAX) = NULL,
    @scientific           NVARCHAR(MAX) = NULL,
    @technology           NVARCHAR(MAX) = NULL,
    @commercial           NVARCHAR(MAX) = NULL,
    @patient              NVARCHAR(MAX) = NULL,
    @regulatory           NVARCHAR(MAX) = NULL,
    @generated_by         NVARCHAR(100) = 'AI'
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [dbo].[reform_fact_strategy]
        ([candidate_id],[summary_text],[scientific],[technology],
         [commercial],[patient],[regulatory],[generated_by])
    VALUES
        (@candidate_id,@summary_text,@scientific,@technology,
         @commercial,@patient,@regulatory,@generated_by);

    SELECT SCOPE_IDENTITY() AS [strategy_id];
END;
GO


-- SP-6  GetAnalytics
--       Dashboard KPIs for the analytics ticker strip.
--       Called by : GET /api/analytics
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_reform_GetAnalytics]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COUNT(DISTINCT m.[molecule_id])                                  AS [molecules_tracked],
        SUM(CASE WHEN c.[is_505b2_candidate]    = 1 THEN 1 ELSE 0 END)  AS [eligible_505b2],
        SUM(CASE WHEN c.[is_ftf_anda_candidate] = 1 THEN 1 ELSE 0 END)  AS [ftf_anda],
        SUM(CASE WHEN c.[is_rare_disease_focus] = 1 THEN 1 ELSE 0 END)  AS [rare_disease],
        CAST(AVG(CAST(c.[opportunity_score] AS FLOAT)) AS DECIMAL(5,1)) AS [avg_opp_score]
    FROM  [dbo].[reform_fact_candidate]  c
    JOIN  [dbo].[reform_dim_molecule]    m ON m.[molecule_id] = c.[molecule_id];
END;
GO


-- SP-7  LogSearch
--       Records every search call for analytics / audit.
--       Called internally by the API after each /api/candidates call.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_reform_LogSearch]
    @opportunity_type NVARCHAR(20)  = NULL,
    @filters_json     NVARCHAR(MAX) = NULL,
    @result_count     INT           = NULL,
    @ip_address       NVARCHAR(50)  = NULL,
    @user_agent       NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [dbo].[reform_audit_search_log]
        ([opportunity_type],[filters_json],[result_count],[ip_address],[user_agent])
    VALUES
        (@opportunity_type,@filters_json,@result_count,@ip_address,@user_agent);
END;
GO


-- ============================================================
--  SECTION 8 : SEED DATA  (reference lookups)
-- ============================================================

-- ROA
INSERT INTO [dbo].[reform_ref_roa] ([roa_name])
SELECT v.[n] FROM (VALUES
    ('ORAL'),('INTRAVENOUS'),('SUBCUTANEOUS'),('INTRAMUSCULAR'),
    ('TRANSDERMAL'),('INHALATION'),('TOPICAL'),('OPHTHALMIC'),
    ('INTRANASAL'),('RECTAL'),('SUBLINGUAL'),('INTRATHECAL'),
    ('INTRAARTICULAR'),('INTRAVITREAL'),('BUCCAL')
) v(n)
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[reform_ref_roa] WHERE [roa_name] = v.[n]);
GO

-- Dosage Form
INSERT INTO [dbo].[reform_ref_dosage_form] ([dosage_form_name])
SELECT v.[n] FROM (VALUES
    ('TABLET'),('CAPSULE'),('SOLUTION'),('SUSPENSION'),('INJECTION'),
    ('PATCH'),('CREAM'),('GEL'),('OINTMENT'),('INHALER'),('SUPPOSITORY'),
    ('POWDER'),('GRANULE'),('SYRUP'),('FILM'),('IMPLANT'),('SPRAY'),
    ('EMULSION'),('LOTION'),('FOAM')
) v(n)
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[reform_ref_dosage_form] WHERE [dosage_form_name] = v.[n]);
GO

-- Molecule Type
INSERT INTO [dbo].[reform_ref_molecule_type] ([molecule_type_name])
SELECT v.[n] FROM (VALUES
    ('Small Molecule'),('Biologic'),('Peptide'),
    ('Oligonucleotide'),('Cell / Gene Therapy'),('Natural Product')
) v(n)
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[reform_ref_molecule_type] WHERE [molecule_type_name] = v.[n]);
GO

-- Disease Area
INSERT INTO [dbo].[reform_ref_disease_area] ([disease_area_name])
SELECT v.[n] FROM (VALUES
    ('Oncology'),('Cardiovascular'),('Central Nervous System'),
    ('Infectious Disease'),('Immunology & Inflammation'),
    ('Endocrinology & Metabolism'),('Respiratory'),('Gastroenterology'),
    ('Ophthalmology'),('Rare Disease / Orphan'),('Dermatology'),
    ('Hematology'),('Nephrology'),('Rheumatology'),('Pain')
) v(n)
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[reform_ref_disease_area] WHERE [disease_area_name] = v.[n]);
GO


-- ============================================================
--  END OF SCHEMA
-- ============================================================
