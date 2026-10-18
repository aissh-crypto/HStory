import { CaseFile } from '../types';

/**
 * Shared helper to determine if a module is considered completed ('done')
 */
export const isModuleDone = (moduleKey: string, mod: any): boolean => {
  if (!mod) return false;
  if (mod.status === 'done' || mod.completed === true) return true;
  if (moduleKey === 'site') {
    const list = mod.checklist || [];
    const checked = list.filter((i: any) => i.status && i.status !== 'pending').length;
    return checked > 0 && checked === list.length;
  }
  if (moduleKey === 'checklist') {
    const list = mod.checklist || [];
    const checked = list.filter((i: any) => i.status === 'verified').length;
    return checked > 0 && checked === list.length;
  }
  return false;
};

/**
 * Shared helper to determine if a module is considered 'in progress'
 */
export const isModuleInProgress = (moduleKey: string, mod: any): boolean => {
  if (!mod) return false;
  if (isModuleDone(moduleKey, mod)) return false;
  if (mod.status === 'in progress') return true;
  if (moduleKey === 'site') {
    const list = mod.checklist || [];
    const checked = list.filter((i: any) => i.status && i.status !== 'pending').length;
    return (
      checked > 0 ||
      Boolean(mod.photos && mod.photos.length > 0) ||
      Boolean(mod.transcripts && mod.transcripts.length > 0) ||
      Boolean(mod.inspectionVideos && mod.inspectionVideos.length > 0)
    );
  }
  if (moduleKey === 'checklist') {
    const list = mod.checklist || [];
    const checked = list.filter((i: any) => i.status === 'verified').length;
    return checked > 0;
  }
  return false;
};

/**
 * Computes overall case file progress percentage and status uniformly
 */
export const computeCaseFileProgress = (
  caseFile: Partial<CaseFile> | any
): {
  completedCount: number;
  inProgressCount: number;
  progressPercent: number;
  status: 'Not Started' | 'In Progress' | 'Decision Ready';
} => {
  const mods = caseFile?.modules || {};
  const modulesList: Array<{ key: string; mod: any }> = [
    { key: 'price', mod: mods.priceAnalysis },
    { key: 'stress', mod: mods.stressTest },
    { key: 'developer', mod: mods.developerAudit },
    { key: 'site', mod: mods.siteVisit },
    { key: 'checklist', mod: mods.countryCompliance },
  ];

  const completedCount = modulesList.filter((m) => isModuleDone(m.key, m.mod)).length;
  const inProgressCount = modulesList.filter((m) => isModuleInProgress(m.key, m.mod)).length;

  const progressPercent =
    completedCount === 5
      ? 100
      : Math.min(95, Math.round(completedCount * 20 + inProgressCount * 10));

  const status: 'Not Started' | 'In Progress' | 'Decision Ready' =
    completedCount === 5
      ? 'Decision Ready'
      : completedCount > 0 || inProgressCount > 0
      ? 'In Progress'
      : 'Not Started';

  return { completedCount, inProgressCount, progressPercent, status };
};
