import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

export function usePortfolio(userId) {
  const [periods,          setPeriods]          = useState([]);
  const [activePeriod,     setActivePeriod]     = useState(null);
  const [skuRows,          setSkuRows]          = useState([]);
  const [tradeInvestment,  setTradeInvestment]  = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState(null);
  const saveTimerRef = useRef({});

  const sb = getSupabaseClient();

  // ── Load all periods for this user ────────────────────────────
  const loadPeriods = useCallback(async () => {
    if (!userId) return;
    console.log('[loadPeriods] Fetching for user:', userId);
    const { data, error } = await sb
      .from('periods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[loadPeriods] Supabase error:', error.message, error.details, error.hint, error.code);
    } else {
      console.log('[loadPeriods] Found', (data || []).length, 'periods');
      setPeriods(data || []);
    }
  }, [userId]);

  // ── Load SKU rows + trade investment for a period ─────────────
  const loadPeriodData = useCallback(async (periodId) => {
    if (!periodId) return;
    console.log('[loadPeriodData] Fetching data for period:', periodId);
    setLoading(true);
    const [skuRes, tradeRes] = await Promise.all([
      sb.from('sku_rows').select('*').eq('period_id', periodId).order('created_at'),
      sb.from('trade_investment').select('*').eq('period_id', periodId),
    ]);
    if (skuRes.error) console.error('[loadPeriodData] SKU fetch error:', skuRes.error.message, skuRes.error.code);
    if (tradeRes.error) console.error('[loadPeriodData] Trade fetch error:', tradeRes.error.message, tradeRes.error.code);
    console.log('[loadPeriodData] Loaded', (skuRes.data || []).length, 'SKUs,', (tradeRes.data || []).length, 'trade rows');
    setSkuRows(skuRes.data || []);
    setTradeInvestment(tradeRes.data || []);
    setLoading(false);
  }, []);

  // ── Switch active period ───────────────────────────────────────
  const selectPeriod = useCallback(async (period) => {
    setActivePeriod(period);
    await loadPeriodData(period.id);
  }, [loadPeriodData]);

  // ── Create new period ─────────────────────────────────────────
  const createPeriod = useCallback(async ({ label, vertical, company_name }) => {
    console.log('[createPeriod] Inserting:', { user_id: userId, label, vertical });
    const { data, error } = await sb.from('periods').insert({
      user_id: userId, label, vertical,
      company_name: company_name || null,
      is_active: true,
    }).select().single();
    if (error) {
      console.error('[createPeriod] Supabase error:', error.message, error.details, error.hint, error.code);
      setError(error.message);
      return null;
    }
    console.log('[createPeriod] Created:', data.id);
    await loadPeriods();
    await selectPeriod(data);
    return data;
  }, [userId, loadPeriods, selectPeriod]);

  // ── Save single SKU row (upsert, optimistic) ─────────────────
  const saveSku = useCallback(async (row) => {
    // Guard: don't attempt save without required context
    if (!activePeriod?.id || !userId) {
      console.error('[saveSku] Aborted — missing context:', { period_id: activePeriod?.id, user_id: userId });
      return null;
    }
    setSaving(true);
    const tempId = row._tempId;
    // Strip _tempId — it's a client-only key, not a DB column
    const { _tempId, ...rest } = row;
    const payload = { ...rest, period_id: activePeriod.id, user_id: userId };
    // For new rows (no id yet), remove id so Supabase auto-generates it
    if (!payload.id) delete payload.id;
    console.log('[saveSku] Upserting:', { id: payload.id || '(new)', sku_id: payload.sku_id, period_id: payload.period_id });
    const { data, error } = await sb
      .from('sku_rows')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    setSaving(false);
    if (error) {
      console.error('[saveSku] Supabase error:', error.message, error.details, error.hint);
      setError(error.message);
      return null;
    }
    console.log('[saveSku] Saved successfully:', data.id);
    setSkuRows(prev => {
      // Replace matching row — match on id OR _tempId for newly created rows
      const idx = prev.findIndex(r => r.id === data.id || (tempId && r._tempId === tempId));
      return idx >= 0 ? prev.map((r, i) => i === idx ? data : r) : [...prev, data];
    });
    return data;
  }, [activePeriod, userId]);

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

  // ── Add new blank SKU ─────────────────────────────────────────
  const addSku = useCallback(async () => {
    const tempId = `temp_${Date.now()}`;
    const blank = {
      _tempId: tempId,
      period_id: activePeriod?.id,
      user_id: userId,
      active: true,
      sku_id: '', sku_name: '', category: '',
      segment: '', business_unit: '',
      rrp: null, cogs_per_unit: null, monthly_volume_units: null,
    };
    setSkuRows(prev => [...prev, blank]);
    return tempId;
  }, [activePeriod, userId]);

  // ── Soft-delete SKU ───────────────────────────────────────────
  const deleteSku = useCallback(async (id) => {
    if (id.startsWith?.('temp_')) {
      setSkuRows(prev => prev.filter(r => r._tempId !== id && r.id !== id));
      return;
    }
    console.log('[deleteSku] Soft-deleting:', id);
    const { error } = await sb.from('sku_rows').update({ active: false }).eq('id', id);
    if (error) {
      console.error('[deleteSku] Supabase error:', error.message, error.details, error.hint, error.code);
    }
    setSkuRows(prev => prev.filter(r => r.id !== id));
  }, []);

  // ── Save trade investment row ─────────────────────────────────
  const saveTradeInvestment = useCallback(async (row) => {
    if (!activePeriod?.id || !userId) {
      console.error('[saveTradeInvestment] Aborted \u2014 missing context:', { period_id: activePeriod?.id, user_id: userId });
      return null;
    }
    const { _tempId, ...rest } = row;
    const payload = { ...rest, period_id: activePeriod.id, user_id: userId };
    console.log('[saveTradeInvestment] Upserting:', { channel: payload.channel, period_id: payload.period_id, user_id: payload.user_id });
    const { data, error } = await sb
      .from('trade_investment')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.error('[saveTradeInvestment] Supabase error:', error.message, error.details, error.hint, error.code);
      setError(error.message);
      return null;
    }
    console.log('[saveTradeInvestment] Saved:', data.id);
    setTradeInvestment(prev => {
      const idx = prev.findIndex(r => r.id === data.id);
      return idx >= 0 ? prev.map(r => r.id === data.id ? data : r) : [...prev, data];
    });
    return data;
  }, [activePeriod, userId]);

  // ── Init: load periods on mount ───────────────────────────────
  useEffect(() => {
    if (userId) loadPeriods();
  }, [userId, loadPeriods]);

  // ── Auto-select most recent period ───────────────────────────
  useEffect(() => {
    if (periods.length > 0 && !activePeriod) {
      selectPeriod(periods[0]);
    }
  }, [periods, activePeriod, selectPeriod]);

  // Stats for UI
  const activeSkuCount   = skuRows.filter(r => r.active && !r._tempId).length;
  const completeSkuCount = skuRows.filter(r =>
    r.active && r.sku_id && r.sku_name && r.category && r.rrp && r.cogs_per_unit && r.monthly_volume_units
  ).length;

  return {
    periods, activePeriod, skuRows, tradeInvestment,
    loading, saving, error,
    createPeriod, selectPeriod, loadPeriods,
    saveSku, debouncedSaveSku, addSku, deleteSku,
    saveTradeInvestment,
    activeSkuCount, completeSkuCount,
  };
}
