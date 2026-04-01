import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

export default function useDivisions(teamId) {
  const [divisions,     setDivisions]     = useState([]);
  const [activeDivision, setActiveDivision] = useState(null);
  const [loading,       setLoading]       = useState(true);

  const loadDivisions = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    const sb = getSupabaseClient();
    setLoading(true);

    const { data, error } = await sb
      .from('divisions')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_archived', false)
      .order('is_default', { ascending: false })
      .order('name');

    if (!error && data) {
      setDivisions(data);
      // Auto-select default division if none selected yet
      setActiveDivision(prev => {
        if (prev) return prev; // keep existing selection
        const def = data.find(d => d.is_default) || data[0] || null;
        return def;
      });
    } else if (error) {
      // Divisions table may not exist yet (pre-migration) — graceful degradation
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useDivisions] Could not load divisions (table may not exist yet):', error.message);
      }
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => { loadDivisions(); }, [loadDivisions]);

  const createDivision = useCallback(async (name, sector = null) => {
    if (!teamId) return { error: 'No team' };
    const sb = getSupabaseClient();

    const { data, error } = await sb
      .from('divisions')
      .insert({ team_id: teamId, name, sector })
      .select()
      .single();

    if (!error) await loadDivisions();
    return { data, error };
  }, [teamId, loadDivisions]);

  const renameDivision = useCallback(async (divisionId, newName) => {
    const sb = getSupabaseClient();
    const { error } = await sb
      .from('divisions')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', divisionId);

    if (!error) await loadDivisions();
    return { error };
  }, [loadDivisions]);

  const archiveDivision = useCallback(async (divisionId) => {
    // Don't allow archiving the default division
    const div = divisions.find(d => d.id === divisionId);
    if (div?.is_default) return { error: 'Cannot archive the default division' };

    const sb = getSupabaseClient();
    const { error } = await sb
      .from('divisions')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', divisionId);

    if (!error) {
      await loadDivisions();
      // If the archived division was active, switch to default
      if (activeDivision?.id === divisionId) {
        const def = divisions.find(d => d.is_default && d.id !== divisionId);
        setActiveDivision(def || null);
      }
    }
    return { error };
  }, [divisions, activeDivision, loadDivisions]);

  const deleteDivision = useCallback(async (divisionId) => {
    // Don't allow deleting the default division
    const div = divisions.find(d => d.id === divisionId);
    if (div?.is_default) return { error: 'Cannot delete the default division' };

    const sb = getSupabaseClient();

    // NULL out division_id on all related tables — no ON DELETE CASCADE on FKs,
    // so Postgres would reject the delete if any row still references this division.
    const tables = [
      'periods',
      'profiles',
      'sku_rows',
      'logistics_rows',
      'action_items',
      'trade_investment',
      'logistics_commercial_investment',
    ];
    for (const table of tables) {
      await sb.from(table).update({ division_id: null }).eq('division_id', divisionId);
    }

    const { error } = await sb.from('divisions').delete().eq('id', divisionId);

    if (!error) {
      // If the deleted division was active, switch to default
      if (activeDivision?.id === divisionId) {
        const def = divisions.find(d => d.is_default && d.id !== divisionId);
        setActiveDivision(def || null);
      }
      await loadDivisions();
    }
    return { error };
  }, [divisions, activeDivision, loadDivisions]);

  // ── Sector grouping — for consolidation eligibility ──────────────────────
  const divisionsBySector = useMemo(() => {
    const groups = {};
    divisions.forEach(div => {
      const sector = div.sector;
      if (sector) {
        if (!groups[sector]) groups[sector] = [];
        groups[sector].push(div);
      }
    });
    return groups;
  }, [divisions]);

  // Sectors where 2+ divisions share the same sector → eligible for consolidation
  const consolidatableSectors = useMemo(() => {
    return Object.entries(divisionsBySector)
      .filter(([, divs]) => divs.length >= 2)
      .map(([sector, divs]) => ({ sector, divisions: divs, count: divs.length }));
  }, [divisionsBySector]);

  const canConsolidate = consolidatableSectors.length > 0;

  // ── Ensure a division's sector field is set when a period is created ──────
  // Called from AnalysisContext after createPeriod succeeds.
  // Only writes if the division currently has no sector (null/empty).
  const ensureDivisionSector = useCallback(async (divisionId, sector) => {
    if (!divisionId || !sector) return;
    const div = divisions.find(d => d.id === divisionId);
    if (div && !div.sector) {
      const sb = getSupabaseClient();
      await sb
        .from('divisions')
        .update({ sector, updated_at: new Date().toISOString() })
        .eq('id', divisionId);
      await loadDivisions();
    }
  }, [divisions, loadDivisions]);

  return {
    divisions,
    activeDivision,
    setActiveDivision,
    createDivision,
    renameDivision,
    archiveDivision,
    deleteDivision,
    loading,
    hasDivisions:  divisions.length > 1, // true only when multi-division
    divisionCount: divisions.length,
    reload:        loadDivisions,
    // Consolidation
    divisionsBySector,
    consolidatableSectors,
    canConsolidate,
    ensureDivisionSector,
  };
}
