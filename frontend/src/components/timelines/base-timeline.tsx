import { FC, Fragment } from 'react';
import { Divider, Popover } from 'antd'
import styles from './index.less';
import PopPanel from './pops'
import { keys, sum } from 'lodash';
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

export interface IBaseTLProps {
  result: any,
  latest_result?: any,
  widthScale?: string,
  curMode: string
}
const BaseTL: FC<IBaseTLProps> = (props) => {
  const { result, latest_result, curMode } = props;

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

  return (
    <div>
      {result.total_time ? <div className={styles.timeline_group_total} style={{ width: props.widthScale || '100%' }}>
        {/* {dataParse(totalTime)}s */}
        <span className={styles.timeline_total_label}>Iteration</span>
        <span className={checkChanged(result.timeline.per_iter_training_time, latest_result?.timeline?.per_iter_training_time)}>
          {dataParse(totalTime)}s
        </span>
        <Divider type="vertical" />
        <span className={styles.timeline_total_label}> Number of iterations</span>
        <span className={checkChanged(result.total_time.global_number_of_samples, latest_result?.total_time?.global_number_of_samples)}>
          {Math.floor(result.total_time.global_number_of_samples)}
        </span>
        <Divider type="vertical" />
        <span className={styles.timeline_total_label}> Total duration</span>
        <span className={checkChanged(result.total_time.total_training_time, latest_result?.total_time?.total_training_time)}>
          {dataParse(result.total_time.total_training_time)}s
        </span>
      </div> :
        <div className={styles.timeline_group_total} style={{ width: props.widthScale || '100%' }}>
          {dataParse(totalTime)}s
        </div>
      }
      <div className={styles.timeline_group} style={{ width: props.widthScale || '100%' }}>
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
        <Popover content={renderTip(allreduce_time, COLOR_MAPPING['allReduce'].label)} title="" trigger="hover"
          placement='left'>
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
    </div>
  );
};

export default BaseTL;
