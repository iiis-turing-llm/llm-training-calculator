import { FC } from 'react';
import useModel from 'flooks';
import LogModel from '@/models/logModel';
import { Divider } from 'antd'
import BenchMarkTL from '@/components/timelines/bm-timeline';
import BaseTL from '@/components/timelines/base-timeline';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import './index.less'
import lodash, { sum } from 'lodash';
import Empty from '@/components/empty';
import { useImmer } from 'use-immer';

const items = {
  'guide': 'Guide mode',
  'custom': 'Custom mode',
  'benchmark': 'Benchmark mode'
} as any
export interface IIndexProps { }
const History: FC<IIndexProps> = (props) => {
  const { history_results, setHistory } = useModel(LogModel);
  const newHistoryList = lodash.cloneDeep(history_results)
  const [state, setState] = useImmer({
    ite_index: 0,
  })
  const getTotalTime = (res: any) => {
    const { warmup_time, forward_time, backward_time, cooldown_time, allreduce_time, num_microbatches } = res?.timeline || {}
    const totalTime = sum([warmup_time, forward_time * num_microbatches, backward_time * num_microbatches, cooldown_time, allreduce_time])
    return totalTime
  }
  const getMaxTime = () => {
    return Math.max(...history_results.map((t: any) => {
      if (t.type === 'benchmark') {
        return Number(t.result[state.ite_index].totalTime)
      } else {
        return Number(getTotalTime(t.result))
      }
    }))
  }
  const renderTimeline = (hitem: any) => {
    const maxTime = getMaxTime()
    if (hitem.type === 'benchmark') {
      return <div><BenchMarkTL bm_result={hitem.result} history
        widthScale={`${hitem.result[state.ite_index].totalTime / maxTime * 100}%`}
        onIterChange={(idx: number) => {
          setState({
            ite_index: idx
          })
        }}
      /></div>
    }
    return <div ><BaseTL result={hitem.result} curMode={hitem.type} widthScale={`${getTotalTime(hitem.result) / maxTime * 100}%`} /></div>
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
            {/* {items[hitem.type]}({hitem.ts}) */}
            {hitem.type === 'guide' ? hitem.title : `[${hitem.ts}]${hitem.title}`}
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
