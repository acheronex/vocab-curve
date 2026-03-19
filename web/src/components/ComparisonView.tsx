import type { ComparisonResult } from '../hooks/useComparisonData';
import { PanelALadder } from './comparison/PanelALadder';
import { PanelBCoverage } from './comparison/PanelBCoverage';
import { PanelCCurves } from './comparison/PanelCCurves';
import { PanelDBridge } from './comparison/PanelDBridge';
import { PanelEOverview } from './comparison/PanelEOverview';

interface ComparisonViewProps {
  data: ComparisonResult;
}

export function ComparisonView({ data }: ComparisonViewProps) {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section>
        <PanelALadder data={data} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PanelBCoverage data={data} />
        </div>
        <div className="lg:col-span-2">
          <PanelEOverview data={data} />
        </div>
      </section>

      <section>
        <PanelCCurves data={data} />
      </section>

      <section>
        <PanelDBridge data={data} />
      </section>
    </div>
  );
}
