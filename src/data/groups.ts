import type { GroupId } from '@/engine/types';

/** Group definitions — which groups are relevant for Dallas matches */
export interface GroupDef {
  id: GroupId;
  name: string;
  venue: string;
  dallasRelevance: string;
}

/** Groups relevant to Dallas predictions (D, E, G, H, I, J, K, L) */
export const relevantGroups: GroupDef[] = [
  { id: 'D', name: 'Group D', venue: 'Various', dallasRelevance: '2D feeds M88 (R32)' },
  { id: 'E', name: 'Group E', venue: 'Various', dallasRelevance: '2E feeds M78 (R32)' },
  { id: 'G', name: 'Group G', venue: 'Various', dallasRelevance: '2G feeds M88 (R32)' },
  { id: 'H', name: 'Group H', venue: 'Various', dallasRelevance: '1H feeds M84 then M93 (R16)' },
  { id: 'I', name: 'Group I', venue: 'Various', dallasRelevance: '2I feeds M78 (R32)' },
  { id: 'J', name: 'Group J', venue: 'Various', dallasRelevance: 'Dallas group matches M43/M70; 2J feeds M84' },
  { id: 'K', name: 'Group K', venue: 'Various', dallasRelevance: '2K feeds M83 then M93 (R16)' },
  { id: 'L', name: 'Group L', venue: 'Various', dallasRelevance: 'Dallas group match M21; 2L feeds M83 then M93' },
];

/** All 12 groups */
export const allGroups: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

/** Groups that feed into Dallas knockout matches */
export const dallasKnockoutGroups: GroupId[] = ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'];
