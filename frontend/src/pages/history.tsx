import { FC, forwardRef, useImperativeHandle } from 'react';
import useModel from 'flooks';
import LogModel from '@/models/logModel';
import { Divider, Checkbox, Button, Popover } from 'antd'
import BenchMarkTL from '@/components/timelines/bm-timeline';
import BaseTL from '@/components/timelines/base-timeline';
import { CaretDownOutlined, CaretRightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import './index.less'
import lodash, { sum } from 'lodash';
import Empty from '@/components/empty';
import { useImmer } from 'use-immer';
import { useTranslation } from 'react-i18next';

const items = {
  'guide': 'Guide mode',
  'custom': 'Custom mode',
  'benchmark': 'Benchmark mode'
} as any
export interface IIndexProps {
  onClose?: Function
  ref?: any
}
const History: FC<IIndexProps> = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const { history_results, setHistory } = useModel(LogModel);
  const newHistoryList = lodash.cloneDeep(history_results)
  const [state, setState] = useImmer({
    step: 0,
    ite_index: 0,
    selectedIndex: [] as any[],
  })
  const filteredHistoryList = newHistoryList?.filter((d: any, idx: number) => state.selectedIndex.indexOf(idx) > -1)

  const getTotalTime = (res: any) => {
    const { warmup_time, forward_time, backward_time, cooldown_time, allreduce_time, num_microbatches } = res?.timeline || {}
    const totalTime = sum([warmup_time, forward_time * num_microbatches, backward_time * num_microbatches, cooldown_time, allreduce_time])
    return totalTime
  }
  const getMaxTime = () => {
    return Math.max(...filteredHistoryList.map((t: any) => {
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
            ...state,
            ite_index: idx
          })
        }}
      /></div>
    }
    return <div>
      <BaseTL result={{ ...hitem.result }} curMode={hitem.type}
        widthScale={`${getTotalTime(hitem.result) / maxTime * 100}%`} />
    </div>
  }
  const handleClose = () => {
    if (props.onClose) {
      setState({
        ...state,
        step: 0
      })
      props.onClose()
    }
  }
  const changeCollapse = (idx: number, collapse: boolean) => {
    history_results[idx].collapse = collapse
    setHistory(history_results)
  }
  const genHistoryParams = (data: any) => {
    if (!data) return
    const { cluster, model, other_config, input_config } = data
    return <div className="history-params">
      <div className="history-params-item">
        <div className="history-params-item-title">GPU name</div>
        <div className="history-params-item-value">{cluster?.name}</div>
      </div>
      <div className="history-params-item">
        <div className="history-params-item-title">Bus Bandwidth</div>
        <div className="history-params-item-value">{cluster?.bus_bandwidth}</div>
      </div>
      <div className="history-params-item">
        <div className="history-params-item-title">Per-host network bandwidth</div>
        <div className="history-params-item-value">{cluster?.network_bandwidth}</div>
      </div>
      <Divider />
      <div className="history-params-item">
        <div className="history-params-item-title">Model name</div>
        <div className="history-params-item-value">{model.name}</div>
      </div>
      <div className="history-params-item">
        <div className="history-params-item-title">Minibatch size</div>
        <div className="history-params-item-value">{model.minibatch_size}</div>
      </div>
      <Divider />
      <div className="history-params-item">
        <div className="history-params-item-title">Optimization strategy</div>
        <div className="history-params-item-value">{other_config.optimization_strategy}</div>
      </div>
      <div className="history-params-item">
        <div className="history-params-item-title">Tensor parallel degree</div>
        <div className="history-params-item-value">{other_config.tensor_parallel_degree}</div>
      </div>
      <div className="history-params-item">
        <div className="history-params-item-title">Pipeline parallel degree</div>
        <div className="history-params-item-value">{other_config.pipeline_parallel_degree}</div>
      </div>
      <div className="history-params-item">
        <div className="history-params-item-title">Microbatch size</div>
        <div className="history-params-item-value">{other_config.microbatch_size}</div>
      </div>
      <Divider />
      <div className="history-params-item">
        <div className="history-params-item-title">Total number of tokens</div>
        <div className="history-params-item-value">{input_config.number_of_input_tokens}</div>
      </div>
      <div className="history-params-item">
        <div className="history-params-item-title">Data parallel degree</div>
        <div className="history-params-item-value">{input_config.data_parallel_degree}</div>
      </div>
      <div className="history-params-item">
        <div className="history-params-item-title">Number of epochs</div>
        <div className="history-params-item-value">{input_config.epochs}</div>
      </div>
    </div>
  }
  useImperativeHandle(ref, () => ({
    handleClose: handleClose
  }));
  if (state.step === 0) {
    return <div>
      {!!newHistoryList?.length && <div className="history-select-tips" >
        {t('select compare')}
      </div>}
      <Checkbox.Group value={state.selectedIndex} style={{ width: '100%' }} onChange={(checkedValues: any[]) => {
        setState({
          ...state,
          selectedIndex: checkedValues
        })
      }}>
        {newHistoryList.reverse().map((hitem: any, idx: number) => {
          return <div className="history-select-item" key={idx}>
            <Checkbox value={history_results.length - idx - 1}>
              {`${hitem.title}_${hitem.ts}`}
              {hitem.type === 'guide' && <Popover showArrow={true}
                placement="right"
                title={`${hitem.title}_${hitem.ts}`}
                content={genHistoryParams(hitem.input)}>
                <span style={{ marginLeft: 10 }}><QuestionCircleOutlined /></span>
              </Popover>}
            </Checkbox>
            {idx !== newHistoryList.length - 1 && <Divider />}
          </div>
        })}
      </Checkbox.Group>
      {!newHistoryList.length && <Empty></Empty>}
      <div className='history-footer'>
        <Button onClick={handleClose}>
          {t('cancel')}
        </Button>
        <Button type="primary" disabled={state.selectedIndex?.length < 1} onClick={() => {
          setState({ ...state, step: 1 })
        }}>
          {t('compare')}
        </Button>
      </div>
    </div>
  }
  return (
    <div>
      {filteredHistoryList.reverse().map((hitem: any, idx: number) => {
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
      <div className='history-footer'>
        <Button onClick={() => {
          setState({ ...state, step: 0 })
        }}>
          {t('return')}
        </Button>
      </div>
    </div>
  );
});

export default History;
