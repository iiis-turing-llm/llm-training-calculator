import { FC } from 'react';
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';

const DETAIL_COLOR_MAPPING: any = {
  forward: {
    category: 'Forward Computation ',
    label: 'Per-loop forward Computation time(s)',
    color: '#BBEFB1'
  },
  forward_alltogether: {
    category: 'Allgather Input ',
    label: 'Per-loop forward allgather time(s)',
    color: '#5470C6'
  },
  backward: {
    category: 'Backward Computation ',
    label: 'Per-loop backward Computation time(s)',
    color: '#73C0DE'
  },
  backward_alltogether: {
    category: 'Allgather Input ',
    label: 'Per-loop backward allgather time(s)',
    color: '#FC8452'
  },
  backward_reduce: {
    category: 'ReduceScatter Grad Input ',
    label: 'Per-loop backward reduce_ scatter time(s)',
    color: '#9A60B4'
  },
}
export interface IPanelRightPopProps {
  result: any,
  otherConfig?: any
}
const PanelRightPop: FC<IPanelRightPopProps> = (props) => {
  // const { result, otherConfig } = useModel(ProjectModel);
  const { result, otherConfig } = props
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
  const noPCIE = () => {
    if (otherConfig?.tensor_parallel_degree === 1) {
      return true
    }
    return false
  }
  const { forward_time, backward_time, num_microbatches, forward_gpu_usage, backward_gpu_usage,
    per_loop_forward_computation_time, per_loop_backward_computation_time,
    per_loop_forward_allgather_time, per_loop_backward_allgather_time,
    per_loop_backward_reduce_scatter_time, stable_time } = result?.timeline || {}

  const maxTime = Math.max(
    per_loop_forward_computation_time + per_loop_forward_allgather_time,
    per_loop_backward_computation_time,
    per_loop_backward_allgather_time + per_loop_backward_reduce_scatter_time
  )
  const calcLength = (time: number) => {
    return `${(time / maxTime) * 50}%`
  }
  const calcPositionLeft = (leftTime: number) => {
    return `${(leftTime / maxTime) * 50 + 25}%`
  }
  return <div className={styles.pop_wrapper}>
    <div className={styles.timeline_group_total}>
      {/* {dataParse(maxTime * 2)}s */}
      {dataParse(stable_time)}s
    </div>
    {/* Forward Detail */}
    <div className={styles.pop_info}>
      <div className={styles.pop_info_title}>Microbatch </div>
      <div className={styles.pop_info_value}>{num_microbatches} </div>
    </div>
    <div className={styles.pop_info}>
      <div className={styles.pop_info_title}>Forward time (GPU usage) </div>
      <div className={styles.pop_info_value}>{dataParse(forward_time)} ({(forward_gpu_usage * 100).toFixed(0)}%) </div>
    </div>
    <div className={styles.pop_chart}>
      <div className={styles.pop_chart_label}>GPU</div>
      <div className={styles.pop_chart_block} style={{
        backgroundColor: DETAIL_COLOR_MAPPING['forward'].color,
        width: calcLength(per_loop_forward_computation_time),
        left: calcPositionLeft(per_loop_forward_allgather_time)
      }}></div>
    </div>
    <div className={styles.pop_chart_arrow}></div>
    {!noPCIE() && <>
      <div className={styles.pop_chart}>
        <div className={styles.pop_chart_label}>PCIE</div>
        <div className={styles.pop_chart_block} style={{
          backgroundColor: DETAIL_COLOR_MAPPING['forward_alltogether'].color,
          width: calcLength(per_loop_forward_allgather_time),
          left: calcPositionLeft(0)
        }}></div>
      </div>
      <div className={styles.pop_chart_arrow}></div>
    </>}
    <div className={styles.pop_chart_legend}>
      <div className={styles.timeline_legend_item} style={{
        backgroundColor: DETAIL_COLOR_MAPPING['forward'].color
      }}></div>
      <span>
        <b>{DETAIL_COLOR_MAPPING['forward'].category}</b>
        {DETAIL_COLOR_MAPPING['forward'].label}
      </span>
    </div>
    {!noPCIE() && <div className={styles.pop_chart_legend}>
      <div className={styles.timeline_legend_item} style={{
        backgroundColor: DETAIL_COLOR_MAPPING['forward_alltogether'].color
      }}></div>
      <span>
        <b>{DETAIL_COLOR_MAPPING['forward_alltogether'].category}</b>
        {DETAIL_COLOR_MAPPING['forward_alltogether'].label}
      </span>
    </div>}
    <div className={styles.blank_space}></div>
    {/* Backward Detail */}
    <div className={styles.pop_info}>
      <div className={styles.pop_info_title}>Backward time (GPU usage) </div>
      <div className={styles.pop_info_value}>{dataParse(backward_time)} ({(backward_gpu_usage * 100).toFixed(0)}%) </div>
    </div>
    <div className={styles.pop_chart}>
      <div className={styles.pop_chart_label}>GPU</div>
      <div className={styles.pop_chart_block} style={{
        backgroundColor: DETAIL_COLOR_MAPPING['backward'].color,
        width: calcLength(per_loop_backward_computation_time),
        left: calcPositionLeft(0)
      }}></div>
    </div>
    <div className={styles.pop_chart_arrow}></div>
    {!noPCIE() && <>
      <div className={styles.pop_chart}>
        <div className={styles.pop_chart_label}>PCIE</div>
        <div className={styles.pop_chart_block} style={{
          backgroundColor: DETAIL_COLOR_MAPPING['backward_alltogether'].color,
          width: calcLength(per_loop_backward_allgather_time),
          left: calcPositionLeft(0)
        }}></div>
        <div className={styles.pop_chart_block} style={{
          backgroundColor: DETAIL_COLOR_MAPPING['backward_reduce'].color,
          width: calcLength(per_loop_backward_reduce_scatter_time),
          left: `calc(${calcPositionLeft(per_loop_backward_allgather_time)} + 1px)`
        }}></div>
      </div>
      <div className={styles.pop_chart_arrow}></div>
    </>}
    <div className={styles.pop_chart_legend}>
      <div className={styles.timeline_legend_item} style={{
        backgroundColor: DETAIL_COLOR_MAPPING['backward'].color
      }}></div>
      <span>
        <b>{DETAIL_COLOR_MAPPING['backward'].category}</b>
        {DETAIL_COLOR_MAPPING['backward'].label}
      </span>
    </div>
    {!noPCIE() && <>
      <div className={styles.pop_chart_legend}>
        <div className={styles.timeline_legend_item} style={{
          backgroundColor: DETAIL_COLOR_MAPPING['backward_alltogether'].color
        }}></div>
        <span>
          <b>{DETAIL_COLOR_MAPPING['backward_alltogether'].category}</b>
          {DETAIL_COLOR_MAPPING['backward_alltogether'].label}
        </span>
      </div>
      <div className={styles.pop_chart_legend}>
        <div className={styles.timeline_legend_item} style={{
          backgroundColor: DETAIL_COLOR_MAPPING['backward_reduce'].color
        }}></div>
        <span>
          <b>{DETAIL_COLOR_MAPPING['backward_reduce'].category}</b>
          {DETAIL_COLOR_MAPPING['backward_reduce'].label}
        </span>
      </div>
    </>}
    <div className={styles.blank_space}></div>
  </div>
};

export default PanelRightPop;
