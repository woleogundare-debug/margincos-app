import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

/**
 * Division state hook.
 *
 * Admins auto-select the team's default division and can switch freely.
 * Non-admins are locked to `userDivisionId` (their profiles.division_id).
 * If a non-admin has no assigned division, `activeDivision` stays null
 * and the UI surfaces a lockout empty state.
 *
 * The exported `setActiveDivision` is guarded: for non-admins it is a no-op
 * with a dev-mode console warning. Callers see no API change.
 */
export default function useDivisions(teamId, { userDivisionId = null, isAdmin = false } = {}) {
  const [divisions,      setDivisions]      = useState([]);
  const [activeDivision, setActiveDivision] = useState(null);
  const [loading,        setLoading]        = useState(true);

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
      // Auto-select on load. Admins fall back to the team default;
      // non-admins are pinned to their profile.division_id assignment.
      setActiveDivision(prev => {
        // Honour existing admin selection — but re-pin non-admins if
        // a stale selection from a previous session differs from their
        // current userDivisionId assignment.
        if (prev) {
          if (isAdmin) return prev;
          if (userDivisionId && prev.id === userDivisionId) return prev;
          // fall through to re-select below
        }
        if (isAdmin) {
          return data.find(d => d.is_default) || data[0] || null;
        }
        // Non-admin: force to assigned division; null otherwise (lockout).
        if (userDivisionId) {
          const assigned = data.find(d => d.id === userDivisionId);
          if (assigned) return assigned;
        }
        return null;
      });
    } else if (error) {
      // Divisions table may not exist yet (pre-migration) — graceful degradation
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useDivisions] Could not load divisions (table may not exist yet):', error.message);
      }
    }
    setLoading(false);
  }, [teamId, userDivisionId, isAdmin]);

  useEffect(() => { loadDivisions(); }, [loadDivisions]);

  // Guarded setter: non-admins cannot switch active division from the UI.
  // The RLS layer also blocks cross-division reads/writes, but the UI guard
  // gives non-admins a clean experience (no switcher, no empty screens).
  const guardedSetActiveDivision = useCallback((div) => {
    if (!isAdmin) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useDivisions] setActiveDivision blocked: non-admin user attempted switch');
      }
      return;
    }
    setActiveDivision(div);
  }, [isAdmin]);

  const createDivision = useCallback(async (name, sector = null) => {
    if (!teamId) return { error: 'No team' };
    const sb = getSupabaseClient();

    // Inherit sector from the parent team if not explicitly provided.
    let effectiveSector = sector;
    if (!effectiveSector) {
      const { data: team } = await sb
        .from('teams')
        .select('sector')
        .eq('id', teamId)
        .single();
      effectiveSector = team?.sector || null;
    }

    const { data, error } = await sb
      .from('divisions')
      .insert({ team_id: teamId, name, sector: effectiveSector })
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
      // If the archived division was active, fall back appropriately.
      // Admins get the team default; non-admins re-select their assigned
      // division (if still present) or null out to lockout state.
      if (activeDivision?.id === divisionId) {
        if (isAdmin) {
          const def = divisions.find(d => d.is_default && d.id !== divisionId);
          setActiveDivision(def || null);
        } else if (userDivisionId && userDivisionId !== divisionId) {
          const assigned = divisions.find(d => d.id === userDivisionId);
          setActiveDivision(assigned || null);
        } else {
          setActiveDivision(null);
        }
      }
    }
    return { error };
  }, [divisions, activeDivision, loadDivisions, isAdmin, userDivisionId]);

  const deleteDivision = useCallback(async (divisionId) => {
    // Don't allow deleting the default division
    const div = divisions.find(d => d.id === divisionId);
    if (div?.is_default) return { error: 'Cannot delete the default division' };

    const sb = getSupabaseClient();

    // Section B migration (20260410) changed all division_id FKs to
    // ON DELETE SET NULL. Postgres handles cascade now - no client-side
    // NULL-sweep needed. Delete and referenced rows auto-null their division_id.
    const { error } = await sb.from('divisions').delete().eq('id', divisionId);

    if (!error) {
      // If the deleted division was active, fall back appropriately.
      // Same semantics as archiveDivision.
      if (activeDivision?.id === divisionId) {
        if (isAdmin) {
          const def = divisions.find(d => d.is_default && d.id !== divisionId);
          setActiveDivision(def || null);
        } else if (userDivisionId && userDivisionId !== divisionId) {
          const assigned = divisions.find(d => d.id === userDivisionId);
          setActiveDivision(assigned || null);
        } else {
          setActiveDivision(null);
        }
      }
      await loadDivisions();
    }
    return { error };
  }, [divisions, activeDivision, loadDivisions, isAdmin, userDivisionId]);

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

  // Consolidation is admin-only. Non-admins can only see their own division,
  // so consolidated views across sibling divisions are outside their scope.
  const canConsolidate = isAdmin && consolidatableSectors.length > 0;

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
    setActiveDivision: guardedSetActiveDivision,
    createDivision,
    renameDivision,
    archiveDivision,
    deleteDivision,
    loading,
    hasDivisions:  divisions.length > 1, // true only when multi-division
    divisionCount: divisions.length,
    // canSwitchDivision: UI gate for the division switcher. Admin-only,
    // and only meaningful when there's more than one division to switch to.
    canSwitchDivision: isAdmin && divisions.length > 1,
    reload:        loadDivisions,
    // Consolidation
    divisionsBySector,
    consolidatableSectors,
    canConsolidate,
    ensureDivisionSector,
  };
}
