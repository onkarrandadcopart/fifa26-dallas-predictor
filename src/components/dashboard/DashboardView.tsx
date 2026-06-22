import { useState, useMemo } from 'react';
import { useLivePredictions } from '@/engine/useLivePredictions';
import { MatchSelector } from './MatchSelector';
import { MatchPredictionPanel } from './MatchPredictionPanel';
import { LiveScorecard } from './LiveScorecard';
import { DataSourceBadge } from './DataSourceBadge';
import { ResultsBadge } from './ResultsBadge';

export function DashboardView() {
  const [selectedMatch, setSelectedMatch] = useState('M78');

  const { predictions, resolved, groupStatus } = useLivePredictions();

  const matchups = useMemo(() => {
    switch (selectedMatch) {
      case 'M78': return predictions.m78;
      case 'M88': return predictions.m88;
      case 'M93': return predictions.m93;
      case 'M101': return predictions.m101Matchups;
      default: return [];
    }
  }, [selectedMatch, predictions]);

  return (
    <div>
      <LiveScorecard />

      {resolved && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <DataSourceBadge source={resolved.source} timestamp={resolved.timestamp} />
          <ResultsBadge groupStatus={groupStatus} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5 lg:h-[calc(100vh-8rem)]">
        <div className="lg:w-56 shrink-0 lg:overflow-y-auto lg:pr-1">
          <MatchSelector
            selectedMatchId={selectedMatch}
            onSelect={setSelectedMatch}
            predictions={predictions}
          />
        </div>
        <div className="flex-1 min-w-0 lg:overflow-y-auto">
          <MatchPredictionPanel matchId={selectedMatch} matchups={matchups} />
        </div>
      </div>
    </div>
  );
}
