import { FC, Fragment } from 'react';
import { Space, Divider, Popover, Tag, Button } from 'antd'
import { useImmer } from 'use-immer';
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';
import PopPanel from './pops'
import { SyncOutlined, CaretDownOutlined, CaretRightOutlined, ExportOutlined } from '@ant-design/icons';
import { keys, sum } from 'lodash';
import Steps from '../guide-steps'
import FileSaver from 'file-saver'
import { readFile, exportResult, downloadTemplate } from '@/services';
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
  const { result, curGpu, curMode, curModel, otherConfig, setProject } = useModel(ProjectModel);
  const [state, setState] = useImmer({
    memoryCollapse: false,
    computationCollapse: true,
    communicationCollapse: true,
    timelineCollapse: false
  });
  const readExcelFile = async () => {
    setProject({
      result: null
    })
    const readRes = await readFile()
    setProject({
      result: {
        timeline: readRes
      }
    });
  }
  const dataParse = (d: number) => {
    if (!d) return d
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
      return result.memory_usage.overall_usage >= curGpu.memory * 1e9
    }
    return false
  }
  const exportResultFile = () => {
    exportResult({
      ...result, gpu: curGpu, model: curModel, other_config: otherConfig
    }).then((res: any) => {
      FileSaver.saveAs(res, "llm-training-calculator.xlsx");
    })
  }
  const renderTip = (time: number, title: string) => {
    return <div className={styles.pop_tip}>
      <div>{title}(GPU usage)</div>
      {/* <div>{dataParse(time)} ({((time / totalTime) * 100).toFixed(2)}%)</div> */}
      <div>{dataParse(time)} (0%)</div>
    </div>
  }
  const renderDetail = () => {
    return <PopPanel />
  }
  if (!result && curMode === 'guide') {
    return <div className={styles.content}>
      <div className={styles.empty_steps} >
        <div><Steps />
        </div>
      </div>
    </div>
  }
  if (!result) {
    return <div className={styles.content}>
      <div className={styles.empty} >
        <div className={styles.empty_icon}></div>
        <div className={styles.empty_tip}>
          Waiting for calculation...
        </div>
      </div >
    </div>
  }
  return (
    <div className={styles.content}>
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
                  <div>Optimizer States</div>
                  <div>{dataParse(result.memory_usage.optimizer_states)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Weights</div>
                  <div>{dataParse(result.memory_usage.weights)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Gradients</div>
                  <div>{dataParse(result.memory_usage.gradients)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item}>
                  <div>Activation</div>
                  <div>{dataParse(result.memory_usage.activation)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Overall Usage
                    {curGpu && checkMemoryOverall()
                      &&
                      <span>
                        <Tag color="#FF4C4C">OUT OF MEMORY</Tag>
                      </span>
                    }
                  </div>
                  <div className={checkMemoryOverall() ? styles.warning : ''}>{dataParse(result.memory_usage.overall_usage)}</div>
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
                  <div>{result.computation.per_device_layers}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Number of microbatches</div>
                  <div>{result.computation.num_microbatches}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Total forward computation time</div>
                  <div>{dataParse(result.computation.total_forward_computation_time)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item}>
                  <div>Total backward computation time</div>
                  <div>{dataParse(result.computation.total_backward_computation_time)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Per-loop forward computation time</div>
                  <div>{dataParse(result.computation.per_loop_forward_computation_time)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Per-loop backward computation time</div>
                  <div>{dataParse(result.computation.per_loop_backward_computation_time)}</div>
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
                  <div>{result.timeline.per_device_layers}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Number of microbatches</div>
                  <div>{result.timeline.num_microbatches}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Total forward  allgather time</div>
                  <div>{dataParse(result.communication.total_forward_allgather_time)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item_border}>
                  <div>Per-loop forward  allgather time</div>
                  <div>{dataParse(result.communication.per_loop_forward_allgather_time)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Total backward allgather time</div>
                  <div>{dataParse(result.communication.total_backward_allgather_time)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Per-loop backward allgather time</div>
                  <div>{dataParse(result.communication.per_loop_backward_allgather_time)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item_border}>
                  <div>Total backward reduce_scatter time</div>
                  <div>{dataParse(result.communication.total_backward_reduce_scatter_time)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Per-loop backward reduce_scatter time</div>
                  <div>{dataParse(result.communication.per_loop_backward_reduce_scatter_time)}</div>
                </div>
                <div className={styles.result_item_border}>
                  <div>Total p2p time</div>
                  <div>{dataParse(result.communication.total_p2p_time)}</div>
                </div>
              </Space>
              <Space wrap split={<Divider type="vertical" />}>
                <div className={styles.result_item}>
                  <div>Per-loop p2p time</div>
                  <div>{dataParse(result.communication.per_loop_p2p_time)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Word embedding allreduce time</div>
                  <div>{dataParse(result.communication.word_embedding_allreduce_time)}</div>
                </div>
                <div className={styles.result_item}>
                  <div>Gradient allreduce time</div>
                  <div>{dataParse(result.communication.gradient_allreduce_time)}</div>
                </div>
              </Space>
            </div>}
            <Divider />
          </>}
          {/*  Timeline */}
          <div className={styles.result_group_header}>
            <div className={styles.result_group_title}>
              Timeline
              {curMode === 'custom' ? <div>
                <SyncOutlined className={styles.fresh_icon} onClick={readExcelFile} />
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
                <div>Warmup time</div>
                <div>{dataParse(result.timeline.warmup_time)}</div>
              </div>
              <div className={styles.result_item_border}>
                <div>Forward time</div>
                <div>{dataParse(result.timeline.forward_time)}</div>
              </div>
              <div className={styles.result_item_border}>
                <div>Backward time</div>
                <div>{dataParse(result.timeline.backward_time)}</div>
              </div>
            </Space>
            <Space wrap split={<Divider type="vertical" />}>
              <div className={styles.result_item}>
                <div>Cooldown time</div>
                <div>{dataParse(result.timeline.cooldown_time)}</div>
              </div>
              <div className={styles.result_item}>
                <div>Per-iter time</div>
                <div>{dataParse(result.timeline.per_iter_training_time)}</div>
              </div>
              <div className={styles.result_item}>
                <div>All Reduce time</div>
                <div>{dataParse(result.timeline.allreduce_time)}</div>
              </div>
            </Space>
          </div>}
        </div>
        <div className={styles.timeline_group_total}>
          {dataParse(totalTime)}s
        </div>
        <div className={styles.timeline_group}>
          <Popover content={renderTip(warmup_time, COLOR_MAPPING['warmup'].label)} title="" trigger="hover">
            <div className={styles.timeline_block} style={{
              width: calcLength(warmup_time),
              backgroundColor: COLOR_MAPPING['warmup'].color
            }}>
            </div>
          </Popover>
          <Popover content={renderDetail()} title="" trigger="hover">
            <div className={styles.timeline_block_loop} style={{ width: calcLength(loopTotalTime) }}>
              {renderMultiLoopTime()}
            </div>
          </Popover>
          <Popover content={renderTip(cooldown_time, COLOR_MAPPING['cooldown'].label)} title="" trigger="hover">
            <div className={styles.timeline_block} style={{
              width: calcLength(cooldown_time),
              backgroundColor: COLOR_MAPPING['cooldown'].color
            }}>
            </div>
          </Popover>
          <Popover content={renderTip(allreduce_time, COLOR_MAPPING['allReduce'].label)} title="" trigger="hover">
            <div className={styles.timeline_block} style={{
              width: calcLength(allreduce_time),
              backgroundColor: COLOR_MAPPING['allReduce'].color
            }}>
            </div>
          </Popover>
        </div>
        <div className={styles.timeline_group_legend}>
          {keys(COLOR_MAPPING).map((key: string) => {
            const item: any = COLOR_MAPPING[key]
            if (!result.timeline[item.key]) {
              return
            }
            return <Popover content={['forward', 'backward'].indexOf(key) > -1 ? renderDetail() : renderTip(result.timeline[item.key], item.label)
            } title="" trigger="hover" key={key}>
              <div key={key}>
                <div className={styles.timeline_legend_item} style={{ backgroundColor: item.color }}></div>
                <span>{item.label}</span>
              </div>
            </Popover>
          })}
        </div>
        {curMode === 'guide' && <div className={styles.export_btn}>
          <Button type="primary" icon={<ExportOutlined />} onClick={exportResultFile}>EXPORT</Button>
        </div>}
      </div>
    </div >
  );
};

export default PanelRight;
