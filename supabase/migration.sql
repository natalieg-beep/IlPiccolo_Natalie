-- ============================================================
-- Il Piccolo N — Supabase Migration
-- Einmalig im SQL Editor ausführen: supabase.com → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES (Tische)
-- ============================================================
create table if not exists tables (
  id        uuid primary key default uuid_generate_v4(),
  label     text not null,
  location  text not null check (location in ('outside', 'inside'))
);

alter table tables enable row level security;
create policy "auth users" on tables for all to authenticated using (true);

-- Seed: 9 außen + 1 innen
insert into tables (label, location) values
  ('1', 'outside'), ('2', 'outside'), ('3', 'outside'),
  ('4', 'outside'), ('5', 'outside'), ('6', 'outside'),
  ('7', 'outside'), ('8', 'outside'), ('9', 'outside'),
  ('10', 'inside')
on conflict do nothing;

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table if not exists menu_items (
  id        uuid primary key default uuid_generate_v4(),
  name      text not null,
  category  text not null check (category in ('pizza', 'dessert', 'drink', 'coffee')),
  price     numeric(10,2) not null,
  active    boolean default true
);

alter table menu_items enable row level security;
create policy "auth users" on menu_items for all to authenticated using (true);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id            uuid primary key default uuid_generate_v4(),
  table_id      uuid not null references tables(id) on delete cascade,
  opened_at     timestamptz default now(),
  status        text default 'open' check (status in ('open', 'transferred', 'closed')),
  guest_origin  text null,
  age_group     text null,
  party_size    int null,
  note          text null,
  closed_at     timestamptz null
);

alter table orders enable row level security;
create policy "auth users" on orders for all to authenticated using (true);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references orders(id) on delete cascade,
  menu_item_id  uuid null references menu_items(id),
  name          text not null,
  qty           int default 1,
  unit_price    numeric(10,2) not null
);

alter table order_items enable row level security;
create policy "auth users" on order_items for all to authenticated using (true);

-- ============================================================
-- EXPENSES (Ausgaben)
-- ============================================================
create table if not exists expenses (
  id          uuid primary key default uuid_generate_v4(),
  date        date not null,
  amount      numeric(10,2) not null,
  category    text not null check (category in ('investment', 'goods', 'other')),
  is_private  boolean default false,
  vendor      text null,
  note        text null,
  receipt_url text null,
  created_at  timestamptz default now()
);

alter table expenses enable row level security;
create policy "auth users" on expenses for all to authenticated using (true);

-- ============================================================
-- RECURRING COSTS (Fixkosten)
-- ============================================================
create table if not exists recurring_costs (
  id              uuid primary key default uuid_generate_v4(),
  label           text not null,
  monthly_amount  numeric(10,2) not null,
  active          boolean default true,
  start_date      date not null,
  note            text null
);

alter table recurring_costs enable row level security;
create policy "auth users" on recurring_costs for all to authenticated using (true);

-- ============================================================
-- INGREDIENTS (Zutaten)
-- ============================================================
create table if not exists ingredients (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  unit           text not null check (unit in ('kg', 'l', 'Stück')),
  current_price  numeric(10,2) not null,
  supplier       text null,
  updated_at     timestamptz default now()
);

alter table ingredients enable row level security;
create policy "auth users" on ingredients for all to authenticated using (true);

create table if not exists ingredient_price_history (
  id              uuid primary key default uuid_generate_v4(),
  ingredient_id   uuid not null references ingredients(id) on delete cascade,
  price           numeric(10,2) not null,
  date            date not null
);

alter table ingredient_price_history enable row level security;
create policy "auth users" on ingredient_price_history for all to authenticated using (true);

-- ============================================================
-- PHRASES (Türkische Phrasen)
-- ============================================================
create table if not exists phrases (
  id             uuid primary key default uuid_generate_v4(),
  category       text not null,
  turkish        text not null,
  german         text not null,
  pronunciation  text not null default '',
  sort_order     int default 0
);

alter table phrases enable row level security;
create policy "auth users" on phrases for all to authenticated using (true);

insert into phrases (category, turkish, german, pronunciation, sort_order) values
  ('Begrüßung', 'Hoş geldiniz!', 'Willkommen!', 'Hosch geldiniz', 1),
  ('Begrüßung', 'İyi akşamlar!', 'Guten Abend!', 'Iyi akschamlahr', 2),
  ('Begrüßung', 'Buyurun, buyurun!', 'Bitte, bitte! (einladen)', 'Bujurun', 3),
  ('Bestellung', 'Ne almak istersiniz?', 'Was möchten Sie bestellen?', 'Ne almak istersiniz', 1),
  ('Bestellung', 'Hazır mısınız?', 'Sind Sie bereit?', 'Hazyr mysssynyz', 2),
  ('Bestellung', 'Tabii, hemen!', 'Natürlich, sofort!', 'Tabii, hemen', 3),
  ('Bestellung', 'Biraz bekler misiniz?', 'Einen Moment bitte?', 'Biraz bekler misiniz', 4),
  ('Empfehlung', 'Bugünün önerisi...', 'Die Empfehlung des Tages...', 'Bugunun önerisi', 1),
  ('Empfehlung', 'Çok lezzetli!', 'Sehr lecker!', 'Tschok lezzetli', 2),
  ('Bezahlung', 'Hesabı getirebilir miyim?', 'Darf ich die Rechnung bringen?', 'Hesaby getirebiilir miyim', 1),
  ('Bezahlung', 'Nakit mi, kart mı?', 'Bar oder Karte?', 'Nakit mi, kart my', 2),
  ('Bezahlung', 'Üstü kalsın.', 'Der Rest ist für Sie.', 'Üstü kalsyn', 3),
  ('Smalltalk', 'Tatilden mi zevk alıyorsunuz?', 'Genießen Sie den Urlaub?', 'Tatilden mi zevk alyiorsunuz', 1),
  ('Smalltalk', 'Hava çok güzel!', 'Das Wetter ist schön!', 'Hava tschok güzel', 2),
  ('Smalltalk', 'Kaş''ı sevdiniz mi?', 'Mögen Sie Kaş?', 'Kaşy sevdiniz mi', 3),
  ('Problem', 'Özür dilerim!', 'Entschuldigung!', 'Özür dilerim', 1),
  ('Problem', 'Hemen bakıyorum.', 'Ich schau sofort nach.', 'Hemen bakyyorum', 2),
  ('Problem', 'Bir dakika lütfen.', 'Einen Moment bitte.', 'Bir dakika lütfen', 3),
  ('Verabschiedung', 'Afiyet olsun!', 'Guten Appetit!', 'Afijet olsun', 1),
  ('Verabschiedung', 'Siparişiniz hazır!', 'Ihre Bestellung ist fertig!', 'Siparischsiniz hazyr', 2),
  ('Verabschiedung', 'Başka bir şey ister misiniz?', 'Möchten Sie noch etwas?', 'Baschka bir schej ister misiniz', 3),
  ('Verabschiedung', 'Çok teşekkür ederiz!', 'Vielen Dank!', 'Tschok teschekkür ederiz', 4),
  ('Verabschiedung', 'İyi günler, güle güle!', 'Auf Wiedersehen!', 'Iyi günler, güle güle', 5)
on conflict do nothing;
