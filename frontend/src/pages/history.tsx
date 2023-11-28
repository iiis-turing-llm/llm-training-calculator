import { FC } from 'react';
import useModel from 'flooks';
import LogModel from '@/models/logModel';
import { Divider } from 'antd'
import BenchMarkTL from '@/components/timelines/bm-timeline';
import BaseTL from '@/components/timelines/base-timeline';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import './index.less'
import lodash from 'lodash';
import Empty from '@/components/empty';

const items = {
  'guide': 'Guide mode',
  'custom': 'Custom mode',
  'benchmark': 'Benchmark mode'
} as any
export interface IIndexProps { }
const History: FC<IIndexProps> = (props) => {
  const { history_results, setHistory } = useModel(LogModel);
  const newHistoryList = lodash.cloneDeep(history_results)
  const renderTimeline = (hitem: any) => {
    if (hitem.type === 'benchmark') {
      return <BenchMarkTL bm_result={hitem.result} history />
    }
    return <BaseTL result={hitem.result} curMode={hitem.type} />
  }
  const changeCollapse = (idx: number, collapse: boolean) => {
    history_results[idx].collapse = collapse
    setHistory(history_results)
  }
  return (
    <div>
      {newHistoryList.reverse().map((hitem: any, idx: number) => {
        return <div className="history-item" key={`${idx}_${hitem.collapse}`}>
          <div className="history-item-header">
            {items[hitem.type]}({hitem.ts})
            <div className="history-item-header-collapse">{!hitem.collapse ?
              <CaretDownOutlined onClick={() => {
                changeCollapse(history_results.length - idx - 1, true)
              }} /> :
              <CaretRightOutlined onClick={() => {
                changeCollapse(history_results.length - idx - 1, false)
              }} />}
            </div>
          </div>
          {!hitem.collapse && renderTimeline(hitem)}
          {idx < history_results.length - 1 && <Divider dashed />}
        </div>
      })}
      {!newHistoryList.length && <Empty></Empty>}
    </div>
  );
};

export default History;
