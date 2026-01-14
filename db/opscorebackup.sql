--
-- PostgreSQL database dump
--

\restrict Qo3FjMtysrsMtaKHeaXA4lZklNGu8CBjnH5hVYAToRpCf0TvBuLRJ5JSMRfEkoH

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-14 14:06:08

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16392)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 259 (class 1255 OID 16691)
-- Name: check_turnover_threshold(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_turnover_threshold() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            DECLARE
                total_sales DECIMAL;
                total_assets DECIMAL;
                professional_service BOOLEAN;
            BEGIN
                -- 1. Calculate Total Sales (Invoices + Ledger Income)
                SELECT (
                    COALESCE((SELECT SUM(amount) FROM invoices WHERE tenant_id = NEW.tenant_id AND status = 'paid'), 0) +
                    COALESCE((SELECT SUM(amount) FROM transactions WHERE tenant_id = NEW.tenant_id AND type = 'income'), 0)
                ) INTO total_sales;

                -- 2. Calculate Total Assets
                SELECT COALESCE(SUM(amount), 0)
                INTO total_assets
                FROM transactions 
                WHERE tenant_id = NEW.tenant_id 
                AND is_capital_asset = TRUE;

                -- 3. Check Sector
                SELECT is_professional_service INTO professional_service
                FROM tenants
                WHERE id = NEW.tenant_id;

                -- Logic
                IF total_sales > 100000000 OR total_assets > 250000000 OR professional_service = TRUE THEN
                    UPDATE tenants 
                    SET turnover_band = CASE 
                            WHEN total_sales > 100000000 THEN 'large' 
                            ELSE 'medium' 
                        END,
                        is_cit_exempt = FALSE, 
                        is_vat_exempt = FALSE 
                    WHERE id = NEW.tenant_id;
                ELSE
                    UPDATE tenants 
                    SET turnover_band = CASE 
                            WHEN total_sales < 25000000 THEN 'micro'
                            ELSE 'small'
                        END,
                        is_cit_exempt = (total_sales < 100000000), 
                        is_vat_exempt = (total_sales < 25000000) 
                    WHERE id = NEW.tenant_id;
                END IF;

                RETURN NEW;
            END;
            $$;


ALTER FUNCTION public.check_turnover_threshold() OWNER TO postgres;

--
-- TOC entry 248 (class 1255 OID 16740)
-- Name: log_subscription_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_subscription_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO subscription_history (tenant_id, new_status, new_plan, change_reason)
        VALUES (NEW.tenant_id, NEW.status, NEW.plan_type, 'Initial Subscription');
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status OR OLD.plan_type IS DISTINCT FROM NEW.plan_type) THEN
            INSERT INTO subscription_history (tenant_id, old_status, new_status, old_plan, new_plan, change_reason)
            VALUES (NEW.tenant_id, OLD.status, NEW.status, OLD.plan_type, NEW.plan_type, 'Plan Update');
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_subscription_change() OWNER TO postgres;

--
-- TOC entry 247 (class 1255 OID 16689)
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16557)
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'support'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 42832)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    action_type character varying(100),
    details text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 42907)
-- Name: balance_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balance_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    month_year character varying(7),
    opening_balance numeric(19,2),
    total_income numeric(19,2),
    total_expense numeric(19,2),
    closing_balance numeric(19,2),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.balance_history OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 42842)
-- Name: brand_change_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_change_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    change_type character varying(50),
    old_value text,
    new_value text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.brand_change_history OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16998)
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    brand_color character varying(50) DEFAULT '#2252c9'::character varying,
    logo_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 42761)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    serial_id integer NOT NULL,
    tenant_id uuid,
    customer_name character varying(255),
    amount numeric(19,2) NOT NULL,
    vat_amount numeric(19,2) DEFAULT 0,
    status character varying(20) DEFAULT 'draft'::character varying,
    date_issued date DEFAULT CURRENT_DATE,
    items jsonb DEFAULT '[]'::jsonb,
    pdf_generated_at timestamp without time zone,
    reprint_count integer DEFAULT 0,
    sync_status character varying(20) DEFAULT 'synced'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 42760)
-- Name: invoices_serial_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_serial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_serial_id_seq OWNER TO postgres;

--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 226
-- Name: invoices_serial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_serial_id_seq OWNED BY public.invoices.serial_id;


--
-- TOC entry 223 (class 1259 OID 42704)
-- Name: sectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sectors (
    id integer NOT NULL,
    name character varying(100),
    is_exempt_from_small_co_benefit boolean DEFAULT false,
    description text
);


ALTER TABLE public.sectors OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 42703)
-- Name: sectors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sectors_id_seq OWNER TO postgres;

--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 222
-- Name: sectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sectors_id_seq OWNED BY public.sectors.id;


--
-- TOC entry 235 (class 1259 OID 42889)
-- Name: starting_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.starting_balances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    year integer NOT NULL,
    amount numeric(19,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.starting_balances OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 42873)
-- Name: subscription_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    old_status character varying(20),
    new_status character varying(20),
    old_plan character varying(20),
    new_plan character varying(20),
    change_reason text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscription_history OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 42857)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    plan_type character varying(20) DEFAULT 'pro'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone,
    payment_ref character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 42823)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    setting_key character varying(50) NOT NULL,
    setting_value numeric(19,4),
    description text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 42717)
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    serial_id integer NOT NULL,
    business_name character varying(255),
    email character varying(255),
    password_hash character varying(255),
    country_code character varying(10) DEFAULT 'NG'::character varying,
    currency_symbol character varying(5) DEFAULT '₦'::character varying,
    subscription_tier character varying(50) DEFAULT 'free'::character varying,
    account_type character varying(50) DEFAULT 'personal'::character varying,
    brand_color character varying(50) DEFAULT '#2252c9'::character varying,
    logo_url text,
    turnover_band character varying(50) DEFAULT 'micro'::character varying,
    sector character varying(50) DEFAULT 'general'::character varying,
    tax_identity_number character varying(50),
    is_tax_exempt boolean DEFAULT false,
    local_status character varying(20) DEFAULT 'active'::character varying,
    residence_state character varying(50),
    pays_rent boolean DEFAULT false,
    rent_amount numeric(19,2) DEFAULT 0,
    annual_income numeric(19,2) DEFAULT 0,
    business_structure character varying(50),
    is_professional_service boolean DEFAULT false,
    pension_contribution numeric(19,2) DEFAULT 0,
    global_income_days integer DEFAULT 0,
    business_address text,
    phone_number character varying(50),
    sector_id integer,
    is_cit_exempt boolean DEFAULT false,
    is_vat_exempt boolean DEFAULT false,
    stamp_url text,
    invoice_template character varying(50) DEFAULT 'modern'::character varying,
    invoice_font character varying(50) DEFAULT 'inter'::character varying,
    show_watermark boolean DEFAULT false,
    last_login timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 42716)
-- Name: tenants_serial_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenants_serial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenants_serial_id_seq OWNER TO postgres;

--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 224
-- Name: tenants_serial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenants_serial_id_seq OWNED BY public.tenants.serial_id;


--
-- TOC entry 229 (class 1259 OID 42786)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    serial_id integer NOT NULL,
    tenant_id uuid,
    date date NOT NULL,
    type character varying(20),
    amount numeric(19,2) NOT NULL,
    category_id character varying(100),
    category_name character varying(100),
    description text,
    payee character varying(255),
    vendor_tin character varying(50),
    payment_method character varying(50),
    ref_id character varying(100),
    receipt_urls jsonb DEFAULT '[]'::jsonb,
    vat_amount numeric(19,2) DEFAULT 0,
    is_deductible boolean DEFAULT false,
    we_compliant boolean DEFAULT false,
    has_vat_evidence boolean DEFAULT false,
    is_rnd_expense boolean DEFAULT false,
    wallet character varying(50) DEFAULT 'operations'::character varying,
    deduction_tip text,
    is_capital_asset boolean DEFAULT false,
    asset_class character varying(100),
    invoice_id uuid,
    sync_status character varying(20) DEFAULT 'synced'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 42785)
-- Name: transactions_serial_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_serial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_serial_id_seq OWNER TO postgres;

--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 228
-- Name: transactions_serial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_serial_id_seq OWNED BY public.transactions.serial_id;


--
-- TOC entry 4956 (class 2604 OID 42765)
-- Name: invoices serial_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN serial_id SET DEFAULT nextval('public.invoices_serial_id_seq'::regclass);


--
-- TOC entry 4928 (class 2604 OID 42707)
-- Name: sectors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors ALTER COLUMN id SET DEFAULT nextval('public.sectors_id_seq'::regclass);


--
-- TOC entry 4931 (class 2604 OID 42721)
-- Name: tenants serial_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants ALTER COLUMN serial_id SET DEFAULT nextval('public.tenants_serial_id_seq'::regclass);


--
-- TOC entry 4966 (class 2604 OID 42790)
-- Name: transactions serial_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN serial_id SET DEFAULT nextval('public.transactions_serial_id_seq'::regclass);


--
-- TOC entry 5199 (class 0 OID 16557)
-- Dependencies: 220
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (id, email, role, created_at) FROM stdin;
\.


--
-- TOC entry 5210 (class 0 OID 42832)
-- Dependencies: 231
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, tenant_id, action_type, details, "timestamp") FROM stdin;
\.


--
-- TOC entry 5215 (class 0 OID 42907)
-- Dependencies: 236
-- Data for Name: balance_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.balance_history (id, tenant_id, month_year, opening_balance, total_income, total_expense, closing_balance, created_at) FROM stdin;
\.


--
-- TOC entry 5211 (class 0 OID 42842)
-- Dependencies: 232
-- Data for Name: brand_change_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brand_change_history (id, tenant_id, change_type, old_value, new_value, created_at) FROM stdin;
9d4200e5-d3f0-4e00-adb7-226b495bb211	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:43:54.826562
1a5d06d3-4a67-4949-8e2c-fac06f2af873	f75b01c2-3911-45f8-928c-0fa649d54ce1	tax_identity_number	123545682	123545682	2026-01-13 13:43:54.826562
ec743d77-f075-4cdf-bb95-cced6d40209a	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#65341f	#65341f	2026-01-13 13:43:54.826562
ff3fbea2-156d-4d87-87b3-6d9bf2d5f853	f75b01c2-3911-45f8-928c-0fa649d54ce1	stamp_url	\N	\N	2026-01-13 13:43:54.826562
5a4496d2-1482-4793-96ac-83fad1a0f018	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_template	modern	modern	2026-01-13 13:43:54.826562
41e8cd7e-6f6a-420e-8195-4a8d9e4cb840	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_font	inter	inter	2026-01-13 13:43:54.826562
08c043ad-2ccd-48a1-8715-19e506720adb	f75b01c2-3911-45f8-928c-0fa649d54ce1	show_watermark	false	false	2026-01-13 13:43:54.826562
cc12d49b-13b7-4760-9da9-4beccf23272b	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_address	5259 W 500 N	5259 W 500 N	2026-01-13 13:43:54.826562
216d3cd8-3a1c-4ba0-a2d6-a310a9503aca	f75b01c2-3911-45f8-928c-0fa649d54ce1	phone_number	13175153326	13175153326	2026-01-13 13:43:54.826562
b0041142-d14c-4d56-a1a5-bf3b0f06bb38	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:50:15.734774
09456397-f70a-4e31-a715-29688300fee0	f75b01c2-3911-45f8-928c-0fa649d54ce1	tax_identity_number	123545682	123545682	2026-01-13 13:50:15.734774
92dfa57e-3af1-4c23-ada8-4644ae479b71	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#65341f	#703e29	2026-01-13 13:50:15.734774
ad322ade-f554-4652-a8de-c199e69d8069	f75b01c2-3911-45f8-928c-0fa649d54ce1	stamp_url	\N	\N	2026-01-13 13:50:15.734774
685c9b2b-f1c3-416b-80ea-f985eadaa211	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_template	modern	modern	2026-01-13 13:50:15.734774
5704f7d5-e293-4cf5-ac55-db0b7e26ad49	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_font	inter	inter	2026-01-13 13:50:15.734774
044a33c6-df4f-4a20-a4e6-a03caf79354e	f75b01c2-3911-45f8-928c-0fa649d54ce1	show_watermark	false	false	2026-01-13 13:50:15.734774
81611e1f-17c8-4fde-b350-5d056d8931ea	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_address	5259 W 500 N	5259 W 500 N	2026-01-13 13:50:15.734774
02f235e6-6481-45db-9fce-5710a022c077	f75b01c2-3911-45f8-928c-0fa649d54ce1	phone_number	13175153326	13175153326	2026-01-13 13:50:15.734774
a01d41a2-fb29-4581-9353-029884fcb632	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:53:53.463037
ea791c8b-5c0b-4075-a114-caaf0c77bd2d	f75b01c2-3911-45f8-928c-0fa649d54ce1	tax_identity_number	123545682	123545682	2026-01-13 13:53:53.463037
2174ade4-298c-4ae5-a325-1dbaf68f617e	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#703e29	#703e29	2026-01-13 13:53:53.463037
5fff2587-9c69-4b2a-8b08-b430b71970f7	f75b01c2-3911-45f8-928c-0fa649d54ce1	stamp_url	\N	\N	2026-01-13 13:53:53.463037
7d9740d1-eb9b-4b46-8a9a-6e9b4f0cd377	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_template	modern	modern	2026-01-13 13:53:53.463037
c4e5de49-b762-4bbe-aaac-62fbae3b0b6c	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_font	inter	inter	2026-01-13 13:53:53.463037
7683b7f7-dbab-47fe-b1d9-52dbf9e6927d	f75b01c2-3911-45f8-928c-0fa649d54ce1	show_watermark	false	false	2026-01-13 13:53:53.463037
09663c07-87ad-45e5-bbfe-d7483f507374	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_address	5259 W 500 N	5259 W 500 N	2026-01-13 13:53:53.463037
6739c388-ae6a-4953-ac1c-01d503b5bbb0	f75b01c2-3911-45f8-928c-0fa649d54ce1	phone_number	13175153326	13175153326	2026-01-13 13:53:53.463037
46b37e7b-88ab-497f-a133-1f3a165add67	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#703e29	#703e29	2026-01-13 13:55:54.850755
d11d7a50-2c0e-4ee4-8598-d5f0a1e3ba1d	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:55:54.850755
f7022954-49cf-46a9-ab85-70b57f13ee48	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#703e29	#703e29	2026-01-13 13:57:28.843829
1678a85e-987f-4525-9711-ceedc34f7dcc	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:57:28.843829
ed6db319-2845-4697-bda3-42a392762a08	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#703e29	#703e29	2026-01-13 13:57:43.115127
aa6754f1-2d23-4880-9615-712c64538c2c	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:57:43.115127
38c9d62d-c3d6-498d-8d4e-75990787ac74	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#703e29	#703e29	2026-01-13 13:58:13.353689
3823ced1-81e1-41e1-93c1-0609f96ac0c3	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:58:13.353689
1ccd3a19-8a24-4fde-b434-8beb17e4026a	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#703e29	#703e29	2026-01-13 13:58:48.120271
3ab9dd5d-ecf0-48c5-87a3-2a234ecf85b0	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:58:48.120271
0f536239-6184-4a01-9ab4-145482ea9206	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:59:50.067061
0b13fb70-d12a-4c41-9b68-38d42eb545af	f75b01c2-3911-45f8-928c-0fa649d54ce1	tax_identity_number	123545682	123545682	2026-01-13 13:59:50.067061
3b305f9a-8acb-4484-9b27-cf6020dbb323	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#703e29	#703e29	2026-01-13 13:59:50.067061
f4d2e443-6c99-459f-82f0-4f35bfe4dc5d	f75b01c2-3911-45f8-928c-0fa649d54ce1	stamp_url	\N	\N	2026-01-13 13:59:50.067061
0204e161-baa8-44ab-804c-529cc336b008	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_template	modern	modern	2026-01-13 13:59:50.067061
081a0923-a995-43cb-aff6-80e4e3540a62	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_font	inter	inter	2026-01-13 13:59:50.067061
c3ec9ae2-783a-4023-a063-09b684f7cbcf	f75b01c2-3911-45f8-928c-0fa649d54ce1	show_watermark	false	false	2026-01-13 13:59:50.067061
2ad61edf-10d2-4b7c-a83a-f7435976f5fe	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_address	5259 W 500 N	5259 W 500 N	2026-01-13 13:59:50.067061
3a13f41e-d81a-4ed2-8749-2328e78a8e14	f75b01c2-3911-45f8-928c-0fa649d54ce1	phone_number	13175153326	13175153326	2026-01-13 13:59:50.067061
5a208516-0172-449c-8be1-3f37ec414f7e	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_name	Lagos Ventures LLC	Lagos Ventures LLC	2026-01-13 13:36:38.817439
11a974ab-968e-46c1-82a4-3abf00bc2215	f75b01c2-3911-45f8-928c-0fa649d54ce1	tax_identity_number	123545682	123545682	2026-01-13 13:36:38.817439
b4b0d181-e9dc-4149-b2ba-9be225402e68	f75b01c2-3911-45f8-928c-0fa649d54ce1	brand_color	#65341f	#65341f	2026-01-13 13:36:38.817439
af408208-a6ea-4303-970d-23640f6b317d	f75b01c2-3911-45f8-928c-0fa649d54ce1	stamp_url	\N	\N	2026-01-13 13:36:38.817439
5599bc73-0c36-416e-b03e-7ff115662993	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_template	modern	modern	2026-01-13 13:36:38.817439
28e3b177-f0f6-4127-aa53-8c8853b0c143	f75b01c2-3911-45f8-928c-0fa649d54ce1	invoice_font	inter	inter	2026-01-13 13:36:38.817439
6ad0e691-2ea5-4579-970f-c56286910f8c	f75b01c2-3911-45f8-928c-0fa649d54ce1	show_watermark	false	false	2026-01-13 13:36:38.817439
16a7cfa5-45ec-4372-8164-c76cb2259d77	f75b01c2-3911-45f8-928c-0fa649d54ce1	business_address	5259 W 500 N	5259 W 500 N	2026-01-13 13:36:38.817439
5c2e1645-e577-4b9c-9d0d-f68b92a65a42	f75b01c2-3911-45f8-928c-0fa649d54ce1	phone_number	13175153326	13175153326	2026-01-13 13:36:38.817439
\.


--
-- TOC entry 5200 (class 0 OID 16998)
-- Dependencies: 221
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (id, tenant_id, brand_color, logo_url, created_at, updated_at) FROM stdin;
fddc6a38-ddee-4306-92a8-cf25020d50cd	b77d3046-96ec-47c9-bb4a-6e392445f856	#2252c9	\N	2026-01-04 11:00:46.478197	2026-01-04 11:00:46.478197
9a28819e-3604-4e55-bb0d-2de3a5ec44b1	f75b01c2-3911-45f8-928c-0fa649d54ce1	#65341f	\N	2026-01-13 13:47:59.223117	2026-01-13 13:47:59.223117
e9f04d15-c462-47c0-a6ee-f569ed3115d2	bf945edd-134b-4630-88c2-1ac1b4ca7b54	#2252c9	\N	2026-01-13 13:47:59.223117	2026-01-13 13:47:59.223117
ab58840a-d737-4d1f-9fc0-2e2eca761ffd	11111111-1111-1111-1111-111111111111	#2252c9	\N	2026-01-13 13:47:59.223117	2026-01-13 13:47:59.223117
1adeedcc-60f7-4a51-891d-51414bcca8df	22222222-2222-2222-2222-222222222222	#2252c9	\N	2026-01-13 13:47:59.223117	2026-01-13 13:47:59.223117
\.


--
-- TOC entry 5206 (class 0 OID 42761)
-- Dependencies: 227
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, serial_id, tenant_id, customer_name, amount, vat_amount, status, date_issued, items, pdf_generated_at, reprint_count, sync_status, created_at, updated_at) FROM stdin;
d8c31abf-ac58-4a32-9d8a-7e067f6ef1be	32	f75b01c2-3911-45f8-928c-0fa649d54ce1	Big Tea	142975860.00	9975060.00	paid	2026-01-14	[{"id": 1768401677810, "qty": 100000, "amount": 1250, "description": "TEA "}, {"id": 1768402634600, "qty": 8, "amount": 1000100, "description": "logitics"}]	\N	0	synced	2026-01-14 09:42:07.18255	2026-01-14 10:51:00.501046
24047b71-fb64-4595-8d36-9a328784cc65	21	f75b01c2-3911-45f8-928c-0fa649d54ce1	Big coco	72778575.00	5077575.00	paid	2026-01-14	[{"id": 1768367638080, "qty": 1, "amount": 50000000, "description": "wine"}, {"id": 1768367710986, "qty": 10, "amount": 1700100, "description": "VIPs"}, {"id": 1768402598157, "qty": 7, "amount": 100000, "description": "wine cup"}]	2026-01-14 15:51:00.449	0	synced	2026-01-14 00:16:56.189254	2026-01-14 10:51:00.501046
\.


--
-- TOC entry 5202 (class 0 OID 42704)
-- Dependencies: 223
-- Data for Name: sectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sectors (id, name, is_exempt_from_small_co_benefit, description) FROM stdin;
1	Agriculture	t	Exempt from most levies, special incentives
2	Manufacturing	f	Standard CIT rules apply
3	Professional Services	t	Legal, Accountancy, Consulting - NOT exempt from Small Co Levy
4	General Trade	f	Default trading business
5	Oil & Gas	f	Special PPT rates apply
6	Tech	f	\N
7	Retail	f	\N
8	Finance	f	\N
9	Education	f	\N
10	Health	f	\N
11	Service	f	\N
12	salary earner	f	\N
13	general	f	General Trading and Business
14	agriculture	f	Farming and Agriculture
15	manufacturing	f	Production and Manufacturing
16	tech	f	Technology and Software
17	retail	f	Retail Stores
18	finance	f	Financial Services
19	education	f	Schools and Training
20	health	f	Healthcare and Hospitals
\.


--
-- TOC entry 5214 (class 0 OID 42889)
-- Dependencies: 235
-- Data for Name: starting_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.starting_balances (id, tenant_id, year, amount, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5213 (class 0 OID 42873)
-- Dependencies: 234
-- Data for Name: subscription_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_history (id, tenant_id, old_status, new_status, old_plan, new_plan, change_reason, created_at) FROM stdin;
927b09ab-19da-4a7d-9568-ffc8b32e37ef	f75b01c2-3911-45f8-928c-0fa649d54ce1	\N	active	\N	free	Initial Subscription	2026-01-13 10:32:18.287463
7e0d81bc-c886-4e41-8c09-83294029f137	bf945edd-134b-4630-88c2-1ac1b4ca7b54	\N	active	\N	free	Initial Subscription	2026-01-13 10:33:22.540631
\.


--
-- TOC entry 5212 (class 0 OID 42857)
-- Dependencies: 233
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, tenant_id, plan_type, status, start_date, end_date, payment_ref, created_at) FROM stdin;
fc365be6-7ffb-4ca2-b8b5-8c5af8fab405	f75b01c2-3911-45f8-928c-0fa649d54ce1	free	active	2026-01-13 10:32:18.287463	\N	\N	2026-01-13 10:32:18.287463
f9f94c6d-8e6c-4e75-adcd-a670a8f31f92	bf945edd-134b-4630-88c2-1ac1b4ca7b54	free	active	2026-01-13 10:33:22.540631	\N	\N	2026-01-13 10:33:22.540631
\.


--
-- TOC entry 5209 (class 0 OID 42823)
-- Dependencies: 230
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (setting_key, setting_value, description, updated_at) FROM stdin;
vat_rate	7.5000	Standard VAT Rate	2026-01-13 09:54:37.380544
cit_rate_small	0.0000	CIT for turnover < 25M	2026-01-13 09:54:37.380544
cit_rate_medium	30.0000	CIT for turnover > 100M	2026-01-13 09:54:37.380544
development_levy_rate	4.0000	NTA 2025 Dev Levy (4% on Assessable Profit)	2026-01-13 09:54:37.380544
rent_relief_cap	500000.0000	Max Rent Relief Deduction	2026-01-13 09:54:37.380544
pro_monthly_price	2500.0000	Pro Plan Monthly Price (NGN)	2026-01-13 09:54:37.380544
pro_yearly_price	25000.0000	Pro Plan Yearly Price (NGN)	2026-01-13 09:54:37.380544
\.


--
-- TOC entry 5204 (class 0 OID 42717)
-- Dependencies: 225
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, serial_id, business_name, email, password_hash, country_code, currency_symbol, subscription_tier, account_type, brand_color, logo_url, turnover_band, sector, tax_identity_number, is_tax_exempt, local_status, residence_state, pays_rent, rent_amount, annual_income, business_structure, is_professional_service, pension_contribution, global_income_days, business_address, phone_number, sector_id, is_cit_exempt, is_vat_exempt, stamp_url, invoice_template, invoice_font, show_watermark, last_login, created_at, updated_at) FROM stdin;
bf945edd-134b-4630-88c2-1ac1b4ca7b54	6	Adewale Johnson	ade@gmail.com	$2b$10$AmtYYpxy3ONacnSEJAPUN.ku5/s20heQE0b3dgDKEoyX9xu7F9qHa	NG	₦	free	personal	#2252c9	\N	micro	salary earner	PENDING	f	active	Lagos	t	1200000.00	3000000.00	\N	f	0.00	0	5830 Big Oak Dr, Apt D	13175153326	12	f	f	\N	modern	inter	f	2026-01-13 10:33:22.540631	2026-01-13 10:33:22.540631	2026-01-13 10:33:22.540631
11111111-1111-1111-1111-111111111111	1	God Mode Business Ltd	godmode@opcore.ng	\N	NG	₦	pro	business	#2252c9	\N	medium	general	\N	f	active	\N	f	0.00	0.00	\N	f	0.00	0	\N	\N	13	f	f	\N	modern	inter	f	2026-01-13 09:54:37.380544	2026-01-13 09:54:37.380544	2026-01-13 10:39:34.445395
22222222-2222-2222-2222-222222222222	2	John Doe Personal	freeuser@opcore.ng	\N	NG	₦	free	personal	#2252c9	\N	micro	general	\N	f	active	\N	f	0.00	0.00	\N	f	0.00	0	\N	\N	13	f	f	\N	modern	inter	f	2026-01-13 09:54:37.380544	2026-01-13 09:54:37.380544	2026-01-13 10:39:34.445395
f75b01c2-3911-45f8-928c-0fa649d54ce1	5	Lagos Ventures LLC	lagosV@gmail.com	$2b$10$ZQhPFvJuud65oP5y83PTK.EXtTyxZJ2QiDBplb/ZV7WGd6NnWKGIe	NG	₦	free	business	#703e29	\N	large	general	123545682	f	active	\N	\N	\N	\N	llc	f	0.00	0	5259 W 500 N	13175153326	13	f	f	\N	modern	inter	f	2026-01-13 10:32:18.287463	2026-01-13 10:32:18.287463	2026-01-14 10:51:00.501046
\.


--
-- TOC entry 5208 (class 0 OID 42786)
-- Dependencies: 229
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, serial_id, tenant_id, date, type, amount, category_id, category_name, description, payee, vendor_tin, payment_method, ref_id, receipt_urls, vat_amount, is_deductible, we_compliant, has_vat_evidence, is_rnd_expense, wallet, deduction_tip, is_capital_asset, asset_class, invoice_id, sync_status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 226
-- Name: invoices_serial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_serial_id_seq', 59, true);


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 222
-- Name: sectors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sectors_id_seq', 20, true);


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 224
-- Name: tenants_serial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenants_serial_id_seq', 6, true);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 228
-- Name: transactions_serial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_serial_id_seq', 8, true);


--
-- TOC entry 4998 (class 2606 OID 16568)
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- TOC entry 5000 (class 2606 OID 16566)
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- TOC entry 5024 (class 2606 OID 42841)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5036 (class 2606 OID 42914)
-- Name: balance_history balance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history
    ADD CONSTRAINT balance_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5038 (class 2606 OID 42916)
-- Name: balance_history balance_history_tenant_id_month_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history
    ADD CONSTRAINT balance_history_tenant_id_month_year_key UNIQUE (tenant_id, month_year);


--
-- TOC entry 5026 (class 2606 OID 42851)
-- Name: brand_change_history brand_change_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_change_history
    ADD CONSTRAINT brand_change_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 17009)
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- TOC entry 5004 (class 2606 OID 17011)
-- Name: brands brands_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_tenant_id_key UNIQUE (tenant_id);


--
-- TOC entry 5016 (class 2606 OID 42779)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 5006 (class 2606 OID 42715)
-- Name: sectors sectors_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_name_key UNIQUE (name);


--
-- TOC entry 5008 (class 2606 OID 42713)
-- Name: sectors sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);


--
-- TOC entry 5032 (class 2606 OID 42899)
-- Name: starting_balances starting_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.starting_balances
    ADD CONSTRAINT starting_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 5034 (class 2606 OID 42901)
-- Name: starting_balances starting_balances_tenant_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.starting_balances
    ADD CONSTRAINT starting_balances_tenant_id_year_key UNIQUE (tenant_id, year);


--
-- TOC entry 5030 (class 2606 OID 42882)
-- Name: subscription_history subscription_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5028 (class 2606 OID 42867)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 5022 (class 2606 OID 42831)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (setting_key);


--
-- TOC entry 5010 (class 2606 OID 42754)
-- Name: tenants tenants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_email_key UNIQUE (email);


--
-- TOC entry 5012 (class 2606 OID 42750)
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- TOC entry 5014 (class 2606 OID 42752)
-- Name: tenants tenants_serial_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_serial_id_key UNIQUE (serial_id);


--
-- TOC entry 5018 (class 2606 OID 42810)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5020 (class 2606 OID 42812)
-- Name: transactions transactions_ref_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_ref_id_key UNIQUE (ref_id);


--
-- TOC entry 5051 (class 2620 OID 42888)
-- Name: subscriptions trigger_log_sub_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_log_sub_change AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.log_subscription_change();


--
-- TOC entry 5049 (class 2620 OID 42926)
-- Name: invoices turnover_watch; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER turnover_watch AFTER INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.check_turnover_threshold();


--
-- TOC entry 5050 (class 2620 OID 42924)
-- Name: transactions turnover_watch_ledger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER turnover_watch_ledger AFTER INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.check_turnover_threshold();


--
-- TOC entry 5048 (class 2620 OID 42922)
-- Name: tenants update_tenants_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tenants_timestamp BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5047 (class 2606 OID 42917)
-- Name: balance_history balance_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history
    ADD CONSTRAINT balance_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5043 (class 2606 OID 42852)
-- Name: brand_change_history brand_change_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_change_history
    ADD CONSTRAINT brand_change_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5040 (class 2606 OID 42780)
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5046 (class 2606 OID 42902)
-- Name: starting_balances starting_balances_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.starting_balances
    ADD CONSTRAINT starting_balances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5045 (class 2606 OID 42883)
-- Name: subscription_history subscription_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5044 (class 2606 OID 42868)
-- Name: subscriptions subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5039 (class 2606 OID 42755)
-- Name: tenants tenants_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);


--
-- TOC entry 5041 (class 2606 OID 42928)
-- Name: transactions transactions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- TOC entry 5042 (class 2606 OID 42813)
-- Name: transactions transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


-- Completed on 2026-01-14 14:06:08

--
-- PostgreSQL database dump complete
--

\unrestrict Qo3FjMtysrsMtaKHeaXA4lZklNGu8CBjnH5hVYAToRpCf0TvBuLRJ5JSMRfEkoH

