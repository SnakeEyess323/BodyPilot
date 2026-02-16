-- =============================================
-- BodyPilot Supabase Veritabani Semasi
-- Bu SQL'i Supabase Dashboard > SQL Editor'de calistirin
-- =============================================

-- Profil tablosu (abonelik plani dahil)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro')),
  polar_customer_id text unique,
  data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Polar customer ID icin index
create index idx_profiles_polar_customer on profiles(polar_customer_id) where polar_customer_id is not null;

-- Kullanici verileri (localStorage yerine)
create table user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  unique(user_id, key)
);

-- Abonelik gecmisi ve odeme takibi
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  plan text not null check (plan in ('free', 'pro')),
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'expired', 'past_due')),
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  payment_provider text,
  payment_provider_sub_id text,
  amount integer,
  currency text default 'TRY',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Kullanim limitleri takibi (gunluk AI mesaj, haftalik program olusturma vb.)
create table usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  created_at timestamptz default now()
);
create index idx_usage_logs_user_action on usage_logs(user_id, action, created_at);

-- =============================================
-- RLS (Row Level Security) Politikalari
-- =============================================

alter table profiles enable row level security;
alter table user_data enable row level security;
alter table subscriptions enable row level security;
alter table usage_logs enable row level security;

-- Profiles
-- Herkes temel profil bilgilerini gorebilir (isim, avatar - leaderboard icin)
create policy "Herkes profilleri gorebilir"
  on profiles for select using (true);
create policy "Kullanici kendi profilini guncelleyebilir"
  on profiles for update using (auth.uid() = id);
create policy "Kullanici kendi profilini olusturabilir"
  on profiles for insert with check (auth.uid() = id);

-- User Data
create policy "Kullanici kendi verisini gorebilir"
  on user_data for select using (auth.uid() = user_id);
create policy "Kullanici kendi verisini yazabilir"
  on user_data for all using (auth.uid() = user_id);

-- Subscriptions
create policy "Kullanici kendi aboneligini gorebilir"
  on subscriptions for select using (auth.uid() = user_id);

-- Not: Subscriptions tablosuna INSERT/UPDATE islemleri
-- Polar webhook handler tarafindan service_role key ile yapilir (RLS bypass)

-- Usage Logs
create policy "Kullanici kendi kullanimini gorebilir"
  on usage_logs for select using (auth.uid() = user_id);
create policy "Kullanici kendi kullanimini yazabilir"
  on usage_logs for insert with check (auth.uid() = user_id);

-- =============================================
-- Trigger: Yeni kullanici kayit olunca otomatik profil olustur
-- =============================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'free'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================
-- Challenge Sistemi
-- =============================================

-- Challenge tanimlari (global + kullanici olusturmus)
create table challenges (
  id text primary key,
  title_tr text not null,
  title_en text not null,
  title_de text not null,
  title_ru text not null,
  description_tr text not null,
  description_en text not null,
  description_de text not null,
  description_ru text not null,
  motivation_tr text not null default '',
  motivation_en text not null default '',
  motivation_de text not null default '',
  motivation_ru text not null default '',
  duration_days integer not null check (duration_days > 0),
  start_date timestamptz not null,
  end_date timestamptz not null,
  icon text not null default '🏆',
  points_per_day integer not null default 10,
  bonus_points integer not null default 50,
  created_at timestamptz default now(),
  -- Kullanici olusturmus challenge alanlari
  creator_id uuid references auth.users on delete set null,
  rules_text text,
  reward_text text,
  creator_name text,
  is_private boolean default false,
  invite_code text unique
);

-- Challenge katilimcilari (kullanici basina)
create table challenge_participants (
  id uuid default gen_random_uuid() primary key,
  challenge_id text references challenges(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamptz default now(),
  points integer default 0,
  completed_days jsonb default '[]',
  status text not null default 'active'
    check (status in ('active', 'completed', 'abandoned')),
  unique(challenge_id, user_id),
  constraint fk_challenge_participant_profile foreign key (user_id) references profiles(id) on delete cascade
);
create index idx_challenge_participants_challenge on challenge_participants(challenge_id);
create index idx_challenge_participants_user on challenge_participants(user_id);

-- Referral kodu icin profiles tablosuna kolon ekle
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text unique;

alter table challenges enable row level security;
alter table challenge_participants enable row level security;

-- Challenges: Herkes gorebilir
create policy "Herkes challenge gorebilir"
  on challenges for select using (true);

-- Challenges: Kullanici kendi challenge'ini olusturabilir
create policy "Kullanici challenge olusturabilir"
  on challenges for insert with check (auth.uid() = creator_id);

-- Challenge Participants: Herkes katilimcilari gorebilir (leaderboard icin)
create policy "Herkes katilimcilari gorebilir"
  on challenge_participants for select using (true);

-- Challenge Participants: Kullanici kendi katilimini yonetebilir
create policy "Kullanici kendi katilimini ekleyebilir"
  on challenge_participants for insert with check (auth.uid() = user_id);
create policy "Kullanici kendi katilimini guncelleyebilir"
  on challenge_participants for update using (auth.uid() = user_id);

-- =============================================
-- Ornek Challenge Verileri
-- =============================================
insert into challenges (id, title_tr, title_en, title_de, title_ru, description_tr, description_en, description_de, description_ru, motivation_tr, motivation_en, motivation_de, motivation_ru, duration_days, start_date, end_date, icon, points_per_day, bonus_points) values
('10-gun-baslangic', '10 Gün Başlangıç', '10 Day Kickstart', '10-Tage-Kickstart', '10-дневный старт', 'Fitness yolculuğuna başlama zamanı! 10 gün boyunca her gün antrenman yap ve alışkanlık kazanmaya başla.', 'Time to start your fitness journey! Work out every day for 10 days and build the habit.', 'Zeit, deine Fitnessreise zu starten! Trainiere 10 Tage lang jeden Tag und baue die Gewohnheit auf.', 'Время начать фитнес-путешествие! Тренируйся каждый день в течение 10 дней и выработай привычку.', 'Her yeni başlangıç, büyük bir dönüşümün ilk adımıdır!', 'Every new beginning is the first step of a great transformation!', 'Jeder neue Anfang ist der erste Schritt einer großen Verwandlung!', 'Каждое новое начало — первый шаг к великой трансформации!', 10, '2026-03-01T00:00:00Z', '2026-03-10T23:59:59Z', '🚀', 10, 50),
('21-gun-aliskanlik', '21 Gün Alışkanlık', '21 Day Habit Builder', '21-Tage-Gewohnheit', '21-дневная привычка', '21 gün boyunca sporu alışkanlık haline getir! Her gün en az 30 dakika hareket et ve vücudunu dönüştür.', 'Make fitness a habit in 21 days! Move at least 30 minutes every day and transform your body.', 'Mach Fitness in 21 Tagen zur Gewohnheit! Bewege dich jeden Tag mindestens 30 Minuten.', 'Сделай фитнес привычкой за 21 день! Двигайся минимум 30 минут каждый день.', 'Alışkanlıklar karakter oluşturur, karakter kader belirler!', 'Habits build character, character determines destiny!', 'Gewohnheiten formen den Charakter, Charakter bestimmt das Schicksal!', 'Привычки формируют характер, характер определяет судьбу!', 21, '2026-03-10T00:00:00Z', '2026-03-30T23:59:59Z', '🔥', 15, 100),
('30-gun-donusum', 'Zirve Dönüşümü', 'Peak Transformation', 'Gipfel-Transformation', 'Пиковая трансформация', 'En sadık kullanıcılar için sonuç odaklı bir maraton! 1. gün kapasiteni test et, her gün artan bir programla ilerle. Her 6 günde 1 aktif dinlenme günü. 30. günde başlangıç skorunu en az %50 artır!', 'A results-driven marathon for the most dedicated users! Test your capacity on day 1, progress with an increasing daily program. Active rest every 6th day. Beat your starting score by at least 50% on day 30!', 'Ein ergebnisorientierter Marathon für die engagiertesten Nutzer! Teste deine Kapazität am 1. Tag, steigere dich täglich. Aktive Ruhe alle 6 Tage. Schlage deinen Startwert am 30. Tag um mindestens 50%!', 'Марафон для самых преданных пользователей! Проверь свои возможности в 1-й день, прогрессируй с ежедневной программой. Активный отдых каждый 6-й день. Побей начальный результат минимум на 50% на 30-й день!', '30 günün sonunda kendi sınırlarını yeniden tanımla. Başarı rozetini profilinde sergile!', 'Redefine your limits in 30 days. Earn the achievement badge and showcase it on your profile!', 'Definiere deine Grenzen in 30 Tagen neu. Verdiene das Erfolgsabzeichen und zeige es in deinem Profil!', 'Переопредели свои пределы за 30 дней. Заработай значок достижения и покажи его в своём профиле!', 30, '2026-04-01T00:00:00Z', '2026-04-30T23:59:59Z', '🏔️', 20, 200);

-- =============================================
-- Polar Odeme Entegrasyonu icin Migration
-- Mevcut veritabanina polar_customer_id eklemek icin:
-- =============================================
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS polar_customer_id text unique;
-- CREATE INDEX IF NOT EXISTS idx_profiles_polar_customer ON profiles(polar_customer_id) WHERE polar_customer_id IS NOT NULL;

-- =============================================
-- Stripe'dan Polar'a gecis icin Migration
-- Eger daha once Stripe kullanildiysa:
-- =============================================
-- ALTER TABLE profiles RENAME COLUMN stripe_customer_id TO polar_customer_id;
-- DROP INDEX IF EXISTS idx_profiles_stripe_customer;
-- CREATE INDEX IF NOT EXISTS idx_profiles_polar_customer ON profiles(polar_customer_id) WHERE polar_customer_id IS NOT NULL;
