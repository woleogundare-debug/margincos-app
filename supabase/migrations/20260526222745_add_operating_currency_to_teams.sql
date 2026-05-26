-- Add operating_currency to teams
--
-- Operating currency becomes a team-level setting, replacing the previous
-- IP-geolocation approach in contexts/CurrencyContext.js. Defaults to NGN so
-- existing teams and any team created without an explicit choice render in
-- Naira. The CHECK constraint mirrors the exact set of currency codes the app
-- supports in CURRENCIES (contexts/CurrencyContext.js) - keep the two in sync.
--
-- Backfill is unnecessary: the NOT NULL DEFAULT applies 'NGN' to the existing
-- row(s) at column-add time. Reversible via DROP COLUMN.

ALTER TABLE public.teams
  ADD COLUMN operating_currency text NOT NULL DEFAULT 'NGN';

ALTER TABLE public.teams
  ADD CONSTRAINT teams_operating_currency_check
  CHECK (operating_currency IN (
    'USD','NGN','GBP','EUR','KES','GHS','ZAR','EGP','MAD','TZS',
    'AED','INR','SGD','BRL','MXN','IDR','PHP','ZMW','RWF','XOF',
    'ETB','UGX','MYR','THB','TWD','JPY','CNY','HKD','AUD','NZD',
    'CAD','CHF','SAR','QAR','PKR','BDT','SEK','NOK','DKK'
  ));
