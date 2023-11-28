import { FC } from 'react';
import useModel from 'flooks';
import ProjectModel from '@/models/projectModel';
import BenchMarkTL from '../timelines/bm-timeline';

export interface IBenchMarkProps { }
const BenchMark: FC<IBenchMarkProps> = (props) => {
  const { bm_result } = useModel(ProjectModel);
  return (
    <div>
      <BenchMarkTL bm_result={bm_result} />
    </div >
  );
};

export default BenchMark;
