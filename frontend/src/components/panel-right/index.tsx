import { FC, Fragment } from 'react';
import { Space, Divider, Popover, Tag, Button, Alert } from 'antd'
import { useImmer } from 'use-immer';
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';
import BenchPanel from './benchmark'
import { LoadingOutlined, CaretDownOutlined, CaretRightOutlined, ExportOutlined } from '@ant-design/icons';
import { sum } from 'lodash';
import Steps from '../guide-steps'
import FileSaver from 'file-saver'
import { exportResult } from '@/services';
import LogModel from '@/models/logModel';
import { useTranslation } from 'react-i18next';
import BaseTL from '../timelines/base-timeline';

const COLOR_MAPPING: any = {
  warmup: {
    label: 'Warmup time',
    color: '#3793FF',
    key: 'warmup_time'
  },
  forward: {
    label: 'Forward time',
    color: '#92CC76',
    key: 'forward_time'
  },
  backward: {
    label: 'Backward time',
    color: '#AAE7FF',
    key: 'backward_time'
  },
  cooldown: {
    label: 'Cooldown time',
    color: '#FAC858',
    key: 'cooldown_time'
  },
  allReduce: {
    label: 'All Reduce time',
    color: '#EF6666',
    key: 'allreduce_time'
  }
}

export interface IPanelRightProps { }
const PanelRight: FC<IPanelRightProps> = (props) => {
  const { t } = useTranslation();
  const { result, latest_result, bm_result, loading, curGpu, curMode, curModel, otherConfig, totalConfig,
    setProject, autoRecalc } = useModel(ProjectModel);
  const { changeLog, autoCalculated } = useModel(LogModel);
  const [state, setState] = useImmer({
    memoryCollapse: false,
    computationCollapse: true,
    communicationCollapse: true,
    timelineCollapse: false
  });
  // const readExcelFile = async () => {
  //   setProject({
  //     result: null
  //   })
  //   const readRes = await readFile()
  //   setProject({
  //     result: {
  //       timeline: readRes
  //     }
  //   });
  // }
  const dataParse = (d: number, toGB?: boolean) => {
    if (!d) return d
    if (toGB) {
      d = d / (1024 * 1024 * 1024)
    }
    // 整数
    if (d.toString() === d.toFixed(0)) {
      return d
    }
    // 大于1的浮点数，保留2位
    if (d > 1) {
      return d.toFixed(2)
    }
    // 小于1的浮点数，保留6位
    return d.toFixed(6)
  }
  const { warmup_time, forward_time, backward_time, cooldown_time, allreduce_time, num_microbatches } = result?.timeline || {}
  const totalTime = sum([warmup_time, forward_time * num_microbatches, backward_time * num_microbatches, cooldown_time, allreduce_time])
  const loopTotalTime = (forward_time + backward_time) * num_microbatches
  const calcLength = (time: number, isMulti?: boolean) => {
    if (isMulti) {
      return `${(time / loopTotalTime) * (100 - Math.ceil(num_microbatches / 10))}%`
    }
    return `${(time / totalTime) * 98}%`
  }
  const checkChanged = (val: any, preVal: any) => {
    if (curMode !== 'guide') {
      return ''
    }
    if (preVal && val !== preVal) {
      return styles.changed
    }
    return ''
  }
  const renderLoopTime = (index: number) => {
    return <Fragment key={index}>
      <div key={index} className={styles.timeline_inner_block} style={{
        width: calcLength(forward_time, true),
        backgroundColor: COLOR_MAPPING['forward'].color
      }}>
      </div>
      <div key={`${index}_1`} className={styles.timeline_inner_block} style={{
        width: calcLength(backward_time, true),
        backgroundColor: COLOR_MAPPING['backward'].color
      }}>
      </div></Fragment>
  }
  const renderMultiLoopTime = () => {
    const numsArray = []
    for (let i = 0; i < num_microbatches; i++) {
      numsArray.push(i)
    }
    return numsArray.map((_, index) =>
      renderLoopTime(index)
    )
  }
  const checkMemoryOverall = () => {
    if (result.memory_usage && curGpu) {
      return result.memory_usage.overall_usage >= curGpu.memory * 1024 * 1024 * 1024
    }
    return false
  }
  const exportResultFile = () => {
    exportResult({
      ...result, cluster: curGpu, model: curModel, other_config: otherConfig, input_config: totalConfig
    }).then((res: any) => {
      FileSaver.saveAs(res, "llm-training-calculator.xlsx");
    })
  }
  // const renderTip = (time: number, title: string) => {
  //   return <div className={styles.pop_tip}>
  //     <div>{title}(GPU usage)</div>
  //     {/* <div>{dataParse(time)} ({((time / totalTime) * 100).toFixed(2)}%)</div> */}
  //     <div>{dataParse(time)} (0%)</div>
  //   </div>
  // }
  // const renderDetail = () => {
  //   return <PopPanel />
  // }
  if (loading) {
    return <div className={styles.loading}><LoadingOutlined /></div>
  }
  if (!result && curMode === 'guide') {
    return <div className={styles.content}>
      <div className={styles.empty_steps} >
        <div><Steps />
        </div>
      </div>
    </div>
  }
  if ((!result && curMode === 'custom') || (!bm_result && curMode === 'benchmark')) {
    return <div className={styles.content}>
      <div className={styles.empty} >
        <div className={styles.empty_icon}></div>
        <div className={styles.empty_tip}>
          {t('wait calc')}
        </div>
      </div >
    </div>
  }
  if (curMode === 'benchmark') {
    return <div className={styles.content}>
      <BenchPanel />
    </div>
  }
  return (
    <div className={styles.content}>
      {autoRecalc && autoCalculated && changeLog.field &&
        <Alert
          message={`${changeLog.field} changed !`}
          type="success"
          closable
        />}
      <div className={styles.result}>
        <div className={styles.result_group}>
          {/* Memory */}
          {result.memory_usage && <>
            <div className={styles.result_group_header}>
              <div className={styles.result_group_title}>
                Memory
              </div>
              <div className={styles.result_group_collapse}>{!state.memoryCollapse ?
                <CaretDownOutlined onClick={() => {
                  setState({ ...state, memoryCollapse: !state.memoryCollapse })
                }} /> :
                <CaretRightOutlined onClick={() => {
                  setState({ ...state, memoryCollapse: !state.memoryCollapse })
                }} />}
              </div>
            </div>
            {!state.memoryCollapse && <div className={styles.result_group_content}>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item_border}>
                  <div>Optimizer States(GB)</div>
                  <div className={checkChanged(result.memory_usage.optimizer_states, latest_result?.memory_usage?.optimizer_states)}>
                    {dataParse(result.memory_usage.optimizer_states, true)}
                  </div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Weights(GB)</div>
                  <div className={checkChanged(result.memory_usage.weights, latest_result?.memory_usage?.weights)}>
                    {dataParse(result.memory_usage.weights, true)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Gradients(GB)</div>
                  <div className={checkChanged(result.memory_usage.gradients, latest_result?.memory_usage?.gradients)}>
                    {dataParse(result.memory_usage.gradients, true)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item}>
                  <div>Activation(GB)</div>
                  <div className={checkChanged(result.memory_usage.activation, latest_result?.memory_usage?.activation)}>
                    {dataParse(result.memory_usage.activation, true)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Overall Usage(GB)
                    {curGpu && checkMemoryOverall()
                      &&
                      <span>
                        <Tag color="#FF4C4C">OUT OF MEMORY</Tag>
                      </span>
                    }
                  </div>
                  <div className={checkMemoryOverall() ? styles.warning : checkChanged(result.memory_usage.overall_usage, latest_result?.memory_usage?.overall_usage)}>
                    {dataParse(result.memory_usage.overall_usage, true)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Totoal number of gpus
                  </div>
                  <div className={checkMemoryOverall() ? styles.warning : checkChanged(result.total_time.totoal_number_of_gpus, latest_result?.total_time?.totoal_number_of_gpus)}>
                    {result.total_time.totoal_number_of_gpus}</div>
                </div>
              </Space>
            </div>}
            <Divider />
          </>}
          {/* Computation Time */}
          {result.computation && <>
            <div className={styles.result_group_header}>
              <div className={styles.result_group_title}>Computation Time</div>
              <div className={styles.result_group_collapse}>{!state.computationCollapse ?
                <CaretDownOutlined onClick={() => {
                  setState({ ...state, computationCollapse: !state.computationCollapse })
                }} /> :
                <CaretRightOutlined onClick={() => {
                  setState({ ...state, computationCollapse: !state.computationCollapse })
                }} />}
              </div>
            </div>
            {!state.computationCollapse && <div className={styles.result_group_content}>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item_border}>
                  <div>Per_device layers</div>
                  <div className={checkChanged(result.computation.per_device_layers, latest_result?.computation?.per_device_layers)}>
                    {result.computation.per_device_layers}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Number of microbatches</div>
                  <div className={checkChanged(result.computation.num_microbatches, latest_result?.computation?.num_microbatches)}>
                    {result.computation.num_microbatches}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Total forward computation time(s)</div>
                  <div className={checkChanged(result.computation.total_forward_computation_time, latest_result?.computation?.total_forward_computation_time)}>
                    {dataParse(result.computation.total_forward_computation_time)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item}>
                  <div>Total backward computation time(s)</div>
                  <div className={checkChanged(result.computation.total_backward_computation_time, latest_result?.computation?.total_backward_computation_time)}>
                    {dataParse(result.computation.total_backward_computation_time)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Per-loop forward computation time(s)</div>
                  <div className={checkChanged(result.computation.per_loop_forward_computation_time, latest_result?.computation?.per_loop_forward_computation_time)}>
                    {dataParse(result.computation.per_loop_forward_computation_time)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Per-loop backward computation time(s)</div>
                  <div className={checkChanged(result.computation.per_loop_backward_computation_time, latest_result?.computation?.per_loop_backward_computation_time)}>
                    {dataParse(result.computation.per_loop_backward_computation_time)}</div>
                </div>
              </Space>
            </div>}
            <Divider />
          </>}
          {/* Communication Time */}
          {result.communication && <>
            <div className={styles.result_group_header}>
              <div className={styles.result_group_title}>Communication Time</div>
              <div className={styles.result_group_collapse}>{!state.communicationCollapse ?
                <CaretDownOutlined onClick={() => {
                  setState({ ...state, communicationCollapse: !state.communicationCollapse })
                }} /> :
                <CaretRightOutlined onClick={() => {
                  setState({ ...state, communicationCollapse: !state.communicationCollapse })
                }} />}
              </div>
            </div>
            {!state.communicationCollapse && <div className={styles.result_group_content}>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item_border}>
                  <div>Per-device layers</div>
                  <div className={checkChanged(result.timeline.per_device_layers, latest_result?.timeline?.per_device_layers)}>
                    {result.timeline.per_device_layers}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Number of microbatches</div>
                  <div className={checkChanged(result.timeline.num_microbatches, latest_result?.timeline?.num_microbatches)}>
                    {result.timeline.num_microbatches}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Total forward  allgather time(s)</div>
                  <div className={checkChanged(result.communication.total_forward_allgather_time, latest_result?.communication?.total_forward_allgather_time)}>
                    {dataParse(result.communication.total_forward_allgather_time)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item_border}>
                  <div>Per-loop forward  allgather time(s)</div>
                  <div className={checkChanged(result.communication.per_loop_forward_allgather_time, latest_result?.communication?.per_loop_forward_allgather_time)}>
                    {dataParse(result.communication.per_loop_forward_allgather_time)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Total backward allgather time(s)</div>
                  <div className={checkChanged(result.communication.total_backward_allgather_time, latest_result?.communication?.total_backward_allgather_time)}>
                    {dataParse(result.communication.total_backward_allgather_time)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Per-loop backward allgather time(s)</div>
                  <div className={checkChanged(result.communication.per_loop_backward_allgather_time, latest_result?.communication?.per_loop_backward_allgather_time)}>
                    {dataParse(result.communication.per_loop_backward_allgather_time)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item_border}>
                  <div>Total backward reduce_scatter time(s)</div>
                  <div className={checkChanged(result.communication.total_backward_reduce_scatter_time, latest_result?.communication?.total_backward_reduce_scatter_time)}>
                    {dataParse(result.communication.total_backward_reduce_scatter_time)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Per-loop backward reduce_scatter time(s)</div>
                  <div className={checkChanged(result.communication.per_loop_backward_reduce_scatter_time, latest_result?.communication?.per_loop_backward_reduce_scatter_time)}>
                    {dataParse(result.communication.per_loop_backward_reduce_scatter_time)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Total p2p time(s)</div>
                  <div className={checkChanged(result.communication.total_p2p_time, latest_result?.communication?.total_p2p_time)}>
                    {dataParse(result.communication.total_p2p_time)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item}>
                  <div>Per-loop p2p time(s)</div>
                  <div className={checkChanged(result.communication.per_loop_p2p_time, latest_result?.communication?.per_loop_p2p_time)}>
                    {dataParse(result.communication.per_loop_p2p_time)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Word embedding allreduce time(s)</div>
                  <div className={checkChanged(result.communication.word_embedding_allreduce_time, latest_result?.communication?.word_embedding_allreduce_time)}>
                    {dataParse(result.communication.word_embedding_allreduce_time)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Gradient allreduce time(s)</div>
                  <div className={checkChanged(result.communication.gradient_allreduce_time, latest_result?.communication?.gradient_allreduce_time)}>
                    {dataParse(result.communication.gradient_allreduce_time)}</div>
                </div>
              </Space>
            </div>}
            <Divider />
          </>}
          {/*  Timeline */}
          <div className={styles.result_group_header}>
            <div className={styles.result_group_title}>
              Timeline
              {curMode === 'custom' ? <div className={styles.result_group_more}>
                <div style={{ paddingRight: 10 }}>
                  Totoal number of gpus:
                </div>
                <div>
                  {result.total_time.totoal_number_of_gpus}</div>
                {/* <SyncOutlined className={styles.fresh_icon} onClick={readExcelFile} /> */}
              </div> :
                <div className={styles.result_group_collapse}>{!state.timelineCollapse ?
                  <CaretDownOutlined onClick={() => {
                    setState({ ...state, timelineCollapse: !state.timelineCollapse })
                  }} /> :
                  <CaretRightOutlined onClick={() => {
                    setState({ ...state, timelineCollapse: !state.timelineCollapse })
                  }} />}
                </div>}
            </div>
          </div>
          {!state.timelineCollapse && <div className={styles.result_group_content}>
            <Space wrap split={<Divider type="vertical" />}>
              <div className={styles.result_item_border}>
                <div>Warmup time(s)</div>
                <div className={checkChanged(result.timeline.warmup_time, latest_result?.timeline?.warmup_time)}>
                  {dataParse(result.timeline.warmup_time)}</div>
              </div>
              <div className={styles.result_item_border}>
                <div>Forward time(s)</div>
                <div className={checkChanged(result.timeline.forward_time, latest_result?.timeline?.forward_time)}>
                  {dataParse(result.timeline.forward_time)}</div>
              </div>
              <div className={styles.result_item_border}>
                <div>Backward time(s)</div>
                <div className={checkChanged(result.timeline.backward_time, latest_result?.timeline?.backward_time)}>
                  {dataParse(result.timeline.backward_time)}</div>
              </div>
            </Space>
            <Space wrap split={<Divider type="vertical" />}>
              <div className={styles.result_item}>
                <div>Cooldown time(s)</div>
                <div className={checkChanged(result.timeline.cooldown_time, latest_result?.timeline?.cooldown_time)}>
                  {dataParse(result.timeline.cooldown_time)}</div>
              </div>
              <div className={styles.result_item}>
                <div>Per-iter time(s)</div>
                <div className={checkChanged(result.timeline.per_iter_training_time, latest_result?.timeline?.per_iter_training_time)}>
                  {dataParse(result.timeline.per_iter_training_time)}</div>
              </div>
              <div className={styles.result_item}>
                <div>All Reduce time(s)</div>
                <div className={checkChanged(result.timeline.allreduce_time, latest_result?.timeline?.allreduce_time)}>
                  {dataParse(result.timeline.allreduce_time)}</div>
              </div>
            </Space>
          </div>}
        </div>
        <BaseTL result={{ ...result, other_config: curMode === 'guide' ? otherConfig : result.other_config }} latest_result={latest_result} curMode={curMode}></BaseTL>
        {curMode === 'guide' && <div className={styles.export_btn}>
          <Button type="primary" icon={<ExportOutlined />} onClick={exportResultFile}>
            {t('export')}
          </Button>
        </div>}
      </div>
    </div >
  );
};

export default PanelRight;
