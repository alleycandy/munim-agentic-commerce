-- Munim / Rao & Sons schema
-- Money is always stored in paise (1 INR = 100 paise) as BIGINT, matching the
-- original TypeScript engine so no floating point ever touches a rupee.

create table merchant (
    id              bigint primary key,
    name            varchar(120)  not null,
    legal_name      varchar(160)  not null,
    established     integer       not null,
    address         varchar(240)  not null,
    gstin           varchar(20)   not null,
    hours           varchar(120)  not null,
    phone           varchar(40)   not null,
    munim_note      varchar(200)  not null,
    razorpay_account varchar(80)  not null,
    story           varchar(400)  not null
);

create table policy (
    id                          bigint primary key,
    max_order_paise             bigint  not null,
    auto_approve_below_paise    bigint  not null,
    daily_cap_paise             bigint  not null,
    allow_credit                boolean not null default false,
    max_payment_retries         integer not null,
    hold_minutes                integer not null,
    require_named_buyer         boolean not null default true,
    trip_next_payment           boolean not null default false
);

create table policy_blocked_category (
    policy_id   bigint not null references policy(id) on delete cascade,
    category    varchar(20) not null,
    primary key (policy_id, category)
);

create table product (
    sku                 varchar(40) primary key,
    name                varchar(120) not null,
    category            varchar(20)  not null,
    unit                varchar(60)  not null,
    pack_qty            integer      not null,
    pack_unit           varchar(20)  not null,
    price_paise         bigint       not null,
    mrp_paise           bigint       not null,
    stock               integer      not null,
    seed_stock          integer      not null,
    gst_pct             integer      not null,
    origin              varchar(120) not null,
    notes_for_agents    varchar(500) not null,
    perishable          boolean      not null default false
);

create table product_alias (
    product_sku varchar(40) not null references product(sku) on delete cascade,
    alias       varchar(80) not null
);
create index idx_product_alias_sku on product_alias(product_sku);

create table product_substitution (
    product_sku         varchar(40) not null references product(sku) on delete cascade,
    substitution_sku     varchar(40) not null
);
create index idx_product_sub_sku on product_substitution(product_sku);

create table shop_session (
    id           uuid primary key,
    buyer_name   varchar(160) not null default '',
    created_at   timestamptz  not null,
    current_quote_id   uuid,
    current_mandate_id uuid,
    current_payment_id varchar(64)
);

create table cart_line (
    id                  bigserial primary key,
    session_id          uuid not null references shop_session(id) on delete cascade,
    sku                 varchar(40) not null references product(sku),
    qty                 integer not null,
    note                varchar(300),
    unit_paise_at_add   bigint not null,
    gst_pct_at_add      integer not null,
    constraint uq_cart_line_session_sku unique (session_id, sku)
);

create table quote_snapshot (
    id                  uuid primary key,
    session_id          uuid not null references shop_session(id) on delete cascade,
    subtotal_paise      bigint not null,
    gst_paise           bigint not null,
    total_paise         bigint not null,
    buyer_name          varchar(160),
    created_at          timestamptz not null
);
create index idx_quote_snapshot_session on quote_snapshot(session_id);

create table quote_line (
    id                  bigserial primary key,
    quote_id            uuid not null references quote_snapshot(id) on delete cascade,
    sku                 varchar(40) not null,
    name                varchar(120) not null,
    qty                 integer not null,
    unit_paise          bigint not null,
    gst_pct             integer not null,
    line_order          integer not null
);

create table quote_warning (
    quote_id    uuid not null references quote_snapshot(id) on delete cascade,
    warning     varchar(400) not null,
    line_order  integer not null
);

create table quote_blocker (
    quote_id    uuid not null references quote_snapshot(id) on delete cascade,
    blocker     varchar(400) not null,
    line_order  integer not null
);

create table mandate (
    id              uuid primary key,
    session_id      uuid not null references shop_session(id) on delete cascade,
    quote_id        uuid references quote_snapshot(id),
    max_paise       bigint not null,
    purpose         varchar(300) not null,
    buyer           varchar(160) not null,
    buyer_kind      varchar(10)  not null,
    created_at      timestamptz  not null,
    expires_at      timestamptz  not null,
    status          varchar(20)  not null,
    reason          varchar(400),
    retries         integer not null default 0
);
create index idx_mandate_session on mandate(session_id);

create table payment (
    id                  varchar(64) primary key,
    mandate_id          uuid not null references mandate(id) on delete cascade,
    amount_paise        bigint not null,
    method              varchar(20) not null,
    status              varchar(20) not null,
    failure_code        varchar(60),
    failure_message     varchar(300),
    created_at          timestamptz not null
);
create index idx_payment_mandate on payment(mandate_id);

create table shop_order (
    id              uuid primary key,
    session_id      uuid references shop_session(id) on delete set null,
    mandate_id      uuid,
    payment_id      varchar(64),
    buyer           varchar(160) not null,
    total_paise     bigint not null,
    status          varchar(20) not null,
    created_at      timestamptz not null,
    note            varchar(400)
);
create index idx_shop_order_created_at on shop_order(created_at desc);

create table order_line (
    id              bigserial primary key,
    order_id        uuid not null references shop_order(id) on delete cascade,
    sku             varchar(40) not null,
    name            varchar(120) not null,
    qty             integer not null,
    unit_paise      bigint not null,
    gst_pct         integer not null
);

create table audit_event (
    id              uuid primary key,
    at              timestamptz not null,
    kind            varchar(30) not null,
    summary         varchar(500) not null,
    money_paise     bigint,
    session_id      uuid
);
create index idx_audit_event_at on audit_event(at desc);

create table audit_event_detail (
    audit_event_id  uuid not null references audit_event(id) on delete cascade,
    detail_key      varchar(60) not null,
    detail_value    varchar(300),
    primary key (audit_event_id, detail_key)
);

create table chat_message (
    id          uuid primary key,
    session_id  uuid not null references shop_session(id) on delete cascade,
    role        varchar(10) not null,
    text        varchar(2000) not null,
    at          timestamptz not null
);
create index idx_chat_message_session on chat_message(session_id, at);
