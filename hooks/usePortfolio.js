import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { TIER_LIMITS } from '../lib/constants';

export function usePortfolio(userId, tier = 'essentials', divisionId = null, teamId = null, ensureDivisionSector = null) {
  const [periods,          setPeriods]          = useState([]);
  const [activePeriod,     setActivePeriod]     = useState(null);
  const [skuRows,          setSkuRows]          = useState([]);
  const [tradeInvestment,  setTradeInvestment]  = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState(null);
  const saveTimerRef = useRef({});

  const sb = getSupabaseClient();

  // ── Load all periods for this user (filtered by division when active) ───
  const loadPeriods = useCallback(async () => {
    if (!userId) return;
    if (process.env.NODE_ENV !== 'production') console.log('[loadPeriods] Fetching for user:', userId, 'division:', divisionId);
    let query = sb
      .from('periods')
      .select('*')
      .eq('user_id', userId);
    // Filter by division when one is active — fall back to all user periods if none
    if (divisionId) {
      query = query.eq('division_id', divisionId);
    }
    const { data, error } = await query.order('id', { ascending: false }); // use id for safe ordering
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[loadPeriods] Supabase error:', error.message, error.details, error.hint, error.code);
      setLoading(false); // prevent infinite spinner on DB error
      return;
    }
    if (process.env.NODE_ENV !== 'production') console.log('[loadPeriods] Found', (data || []).length, 'periods');
    setPeriods(data || []);
  }, [userId, divisionId]);

  // ── Load SKU/Lane rows + trade investment for a period ────────
  const loadPeriodData = useCallback(async (periodId, vertical) => {
    if (!periodId) return;
    const tableName   = vertical === 'Logistics' ? 'logistics_rows'                    : 'sku_rows';
    const ciTableName = vertical === 'Logistics' ? 'logistics_commercial_investment'   : 'trade_investment';
    if (process.env.NODE_ENV !== 'production') console.log('[loadPeriodData] Fetching data for period:', periodId, 'table:', tableName, 'ci-table:', ciTableName);
    setLoading(true);
    const [skuRes, tradeRes] = await Promise.all([
      sb.from(tableName).select('*').eq('period_id', periodId),
      sb.from(ciTableName).select('*').eq('period_id', periodId),
    ]);
    if (skuRes.error && process.env.NODE_ENV !== 'production') console.error('[loadPeriodData] SKU fetch error:', skuRes.error.message, skuRes.error.code);
    if (tradeRes.error && process.env.NODE_ENV !== 'production') console.error('[loadPeriodData] Trade fetch error:', tradeRes.error.message, tradeRes.error.code);
    if (process.env.NODE_ENV !== 'production') console.log('[loadPeriodData] Loaded', (skuRes.data || []).length, 'rows,', (tradeRes.data || []).length, 'CI rows');
    setSkuRows(skuRes.data || []);
    setTradeInvestment(tradeRes.data || []);
    setLoading(false);
  }, []);

  // ── Switch active period ───────────────────────────────────────
  const selectPeriod = useCallback(async (period) => {
    setActivePeriod(period);
    await loadPeriodData(period.id, period.vertical);
  }, [loadPeriodData]);

  // ── Create new period ─────────────────────────────────────────
  const createPeriod = useCallback(async ({ label, vertical, company_name, division_id }) => {
    if (process.env.NODE_ENV !== 'production') console.log('[createPeriod] Inserting:', { user_id: userId, label, vertical, division_id: division_id || divisionId });
    const { data, error } = await sb.from('periods').insert({
      user_id: userId, label, vertical,
      company_name: company_name || null,
      division_id: division_id || divisionId || null,
      team_id: teamId || null,
      is_active: true,
    }).select().single();
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[createPeriod] Supabase error:', error.message, error.details, error.hint, error.code);
      setError(error.message);
      return null;
    }
    if (process.env.NODE_ENV !== 'production') console.log('[createPeriod] Created:', data.id);
    // Ensure the division's sector is set to this period's vertical (only writes if null)
    const effectiveDivisionId = division_id || divisionId;
    if (ensureDivisionSector && effectiveDivisionId && vertical) {
      await ensureDivisionSector(effectiveDivisionId, vertical);
    }
    await loadPeriods();
    await selectPeriod(data);
    return data;
  }, [userId, divisionId, teamId, ensureDivisionSector, loadPeriods, selectPeriod]);

  // ── Save single SKU/Lane row (upsert, optimistic) ────────────
  const saveSku = useCallback(async (row) => {
    // Guard: don't attempt save without required context
    if (!activePeriod?.id || !userId) {
      if (process.env.NODE_ENV !== 'production') console.error('[saveSku] Aborted — missing context:', { period_id: activePeriod?.id, user_id: userId });
      return null;
    }
    const tableName = activePeriod.vertical === 'Logistics' ? 'logistics_rows' : 'sku_rows';
    setSaving(true);
    const tempId = row._tempId;
    // Strip _tempId — it's a client-only key, not a DB column
    const { _tempId, ...rest } = row;
    const payload = { ...rest, period_id: activePeriod.id, user_id: userId, division_id: divisionId || null };
    // Normalize active to 'Y'/'N' text — DB column is text, not boolean
    const a = payload.active;
    payload.active = (a === true || a === 'Y' || a === 'y' || a === 'true' || a === 'Active') ? 'Y' : (a === false || a === 'N' || a === 'n' || a === 'false' || a === 'No' || a === 'Inactive') ? 'N' : 'Y';
    // For new rows (no id yet), remove id so Supabase auto-generates it
    if (!payload.id) delete payload.id;
    const pkField = activePeriod.vertical === 'Logistics' ? 'lane_id' : 'sku_id';
    if (process.env.NODE_ENV !== 'production') console.log('[saveSku] Upserting to', tableName, ':', { id: payload.id || '(new)', [pkField]: payload[pkField], period_id: payload.period_id, user_id: payload.user_id });
    const { data, error } = await sb
      .from(tableName)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    setSaving(false);
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[saveSku] Supabase error:', error.message, error.details, error.hint);
      setError(error.message);
      return null;
    }
    if (process.env.NODE_ENV !== 'production') console.log('[saveSku] Saved successfully:', data.id);
    setSkuRows(prev => {
      // Replace matching row — match on id OR _tempId for newly created rows
      const idx = prev.findIndex(r => r.id === data.id || (tempId && r._tempId === tempId));
      return idx >= 0 ? prev.map((r, i) => i === idx ? data : r) : [...prev, data];
    });
    return data;
  }, [activePeriod, userId, divisionId]);

  // ── Debounced save (for inline grid edits) ────────────────────
  const debouncedSaveSku = useCallback((row, delay = 800) => {
    const key = row.id || row._tempId;
    if (saveTimerRef.current[key]) clearTimeout(saveTimerRef.current[key]);
    // Optimistic update immediately
    setSkuRows(prev => {
      const idx = prev.findIndex(r => r.id === key || r._tempId === key);
      return idx >= 0 ? prev.map(r => (r.id === key || r._tempId === key) ? { ...r, ...row } : r) : prev;
    });
    saveTimerRef.current[key] = setTimeout(() => saveSku(row), delay);
  }, [saveSku]);

  // ── Add new blank SKU / Lane ──────────────────────────────────
  const addSku = useCallback(async () => {
    // Enforce tier cap — null means unlimited
    const isLogistics = activePeriod?.vertical === 'Logistics';
    const limit = isLogistics
      ? (TIER_LIMITS[tier]?.maxLanes ?? null)
      : (TIER_LIMITS[tier]?.maxSkus ?? null);
    if (limit !== null) {
      const currentCount = skuRows.filter(
        r => r.active === 'Y' || r.active === true || r.active === 'y'
      ).length;
      if (currentCount >= limit) {
        const tierLabel = tier === 'essentials' ? 'Essentials' : tier === 'professional' ? 'Professional' : tier;
        const unit = isLogistics ? 'lanes' : 'SKUs';
        return {
          error: true,
          message: `Your ${tierLabel} plan supports up to ${limit} active ${unit}. Upgrade to add more.`,
        };
      }
    }

    const tempId = `temp_${Date.now()}`;
    const blank = activePeriod?.vertical === 'Logistics'
      ? {
          _tempId: tempId,
          period_id: activePeriod?.id,
          user_id: userId,
          active: 'Y',
          lane_id: '', lane_name: '', route_region: '', cargo_type: '',
          contracted_rate_ngn: null, fully_loaded_cost_ngn: null,
          distance_km: null, monthly_trips: null,
        }
      : {
          _tempId: tempId,
          period_id: activePeriod?.id,
          user_id: userId,
          active: 'Y',
          sku_id: '', sku_name: '', category: '',
          segment: '', business_unit: '',
          rrp: null, cogs_per_unit: null, monthly_volume_units: null,
        };
    setSkuRows(prev => [...prev, blank]);
    return tempId;
  }, [activePeriod, userId, tier, skuRows]);

  // ── Soft-delete SKU / Lane ────────────────────────────────────
  const deleteSku = useCallback(async (id) => {
    if (id.startsWith?.('temp_')) {
      setSkuRows(prev => prev.filter(r => r._tempId !== id && r.id !== id));
      return;
    }
    const tableName = activePeriod?.vertical === 'Logistics' ? 'logistics_rows' : 'sku_rows';
    if (process.env.NODE_ENV !== 'production') console.log('[deleteSku] Soft-deleting from', tableName, ':', id);
    const { error } = await sb.from(tableName).update({ active: 'N' }).eq('id', id);
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[deleteSku] Supabase error:', error.message, error.details, error.hint, error.code);
    }
    setSkuRows(prev => prev.filter(r => r.id !== id));
  }, [activePeriod]);

  // ── Delete period (and all child rows) ───────────────────────
  const deletePeriod = useCallback(async (periodId) => {
    if (process.env.NODE_ENV !== 'production') console.log('[deletePeriod] Deleting period:', periodId);
    const res = await fetch('/api/periods/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error || 'Failed to delete period';
      if (process.env.NODE_ENV !== 'production') console.error('[deletePeriod] API error:', msg);
      throw new Error(msg);
    }
    if (process.env.NODE_ENV !== 'production') console.log('[deletePeriod] Deleted successfully:', periodId);
    // Remove from local state
    setPeriods(prev => prev.filter(p => p.id !== periodId));
    // If the deleted period was the active one, clear active state
    if (activePeriod?.id === periodId) {
      setActivePeriod(null);
      setSkuRows([]);
      setTradeInvestment([]);
    }
  }, [activePeriod]);

  // ── Save trade/commercial investment row ──────────────────────
  const saveTradeInvestment = useCallback(async (row) => {
    if (!activePeriod?.id || !userId) {
      if (process.env.NODE_ENV !== 'production') console.error('[saveTradeInvestment] Aborted \u2014 missing context:', { period_id: activePeriod?.id, user_id: userId });
      return null;
    }
    const ciTableName = activePeriod.vertical === 'Logistics' ? 'logistics_commercial_investment' : 'trade_investment';
    const { _tempId, ...rest } = row;
    const payload = { ...rest, period_id: activePeriod.id, user_id: userId, division_id: divisionId || null };
    if (process.env.NODE_ENV !== 'production') console.log('[saveTradeInvestment] Upserting to', ciTableName, ':', { period_id: payload.period_id, user_id: payload.user_id });
    const { data, error } = await sb
      .from(ciTableName)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[saveTradeInvestment] Supabase error:', error.message, error.details, error.hint, error.code);
      setError(error.message);
      return null;
    }
    if (process.env.NODE_ENV !== 'production') console.log('[saveTradeInvestment] Saved:', data.id);
    setTradeInvestment(prev => {
      const idx = prev.findIndex(r => r.id === data.id);
      return idx >= 0 ? prev.map(r => r.id === data.id ? data : r) : [...prev, data];
    });
    return data;
  }, [activePeriod, userId, divisionId]);

  // ── Init: load periods on mount or when userId/divisionId changes ───────
  useEffect(() => {
    if (userId) {
      loadPeriods();
    } else {
      // No user yet (auth still resolving) — don't show "no data"
      // loading will stay true until userId arrives
    }
  }, [userId, loadPeriods]);

  // ── Reset active state when division switches ────────────────
  // loadPeriods is recreated by useCallback when divisionId changes,
  // which re-triggers the [userId, loadPeriods] effect above.
  // CRITICAL: also clear `periods` here — otherwise the auto-select effect
  // immediately fires selectPeriod(periods[0]) on the OLD division's stale
  // periods list before the new filtered loadPeriods completes.
  useEffect(() => {
    setActivePeriod(null);
    setPeriods([]);
    setSkuRows([]);
    setTradeInvestment([]);
  }, [divisionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-select most recent period ───────────────────────────
  useEffect(() => {
    if (periods.length > 0 && !activePeriod) {
      selectPeriod(periods[0]);
    } else if (userId && periods.length === 0 && !activePeriod) {
      // userId present but no periods found — stop loading spinner
      setLoading(false);
    }
  }, [periods, activePeriod, selectPeriod, userId]);

  // Stats for UI — active is stored as text 'Y'/'N' in Supabase
  const isActive = (r) => r.active === 'Y' || r.active === true || r.active === 'y';
  const activeSkuCount   = skuRows.filter(r => isActive(r) && !r._tempId).length;
  const isLogisticsActive = activePeriod?.vertical === 'Logistics';
  const completeSkuCount = skuRows.filter(r =>
    isActive(r) && (isLogisticsActive
      ? r.lane_id && r.lane_name && r.contracted_rate_ngn && r.fully_loaded_cost_ngn && r.distance_km && r.monthly_trips
      : r.sku_id && r.sku_name && r.category && r.rrp && r.cogs_per_unit && r.monthly_volume_units)
  ).length;

  return {
    periods, activePeriod, skuRows, tradeInvestment,
    loading, saving, error,
    createPeriod, selectPeriod, loadPeriods, deletePeriod,
    saveSku, debouncedSaveSku, addSku, deleteSku,
    saveTradeInvestment,
    activeSkuCount, completeSkuCount,
  };
}
