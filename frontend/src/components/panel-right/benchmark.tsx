import { FC, Fragment } from 'react';
import { Popover, Divider, InputNumber } from 'antd'
import { useImmer } from 'use-immer';
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';
import { keys, sum } from 'lodash';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
const COLOR_MAPPING: any = {
  start: {
    label: 'Iteration start time',
    color: '#A458FF',
    key: 'start_time'
  },
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

export interface IBenchMarkProps { }
const BenchMark: FC<IBenchMarkProps> = (props) => {
  const { bm_result } = useModel(ProjectModel);
  const [state, setState] = useImmer({
    ite_index: 0,
    // curIteration: null as any
    // curIteration: bm_result[0]
  });
  const curIteration = bm_result ? bm_result[state.ite_index] : null
  console.log('curIteration', curIteration)
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
    if (d < 0.001) {
      return d.toFixed(6)
    }
    // 小于1的浮点数，保留6位
    return d.toFixed(4)
  }
  const totalTime = curIteration.totalTime
  const loopTotalTime = sum(curIteration.groups.map((i: any) => i.forward + i.backward))
  const calcLength = (time: number, isMulti?: boolean) => {
    if (isMulti) {
      if (time / loopTotalTime < 0.05) {
        return `${(time / loopTotalTime) * 100}%`
      }
      return `${(time / loopTotalTime) * (100 - Math.ceil(curIteration.groups.length / 10))}%`
    }
    return `${(time / totalTime) * 97}%`
  }
  const renderLoopTime = (index: number, forward_time: number, backward_time: number) => {
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
    return curIteration.groups.map((item: any, index: number) =>
      renderLoopTime(index, item.forward, item.backward)
    )
  }

  const renderTip = (time: number, title: string) => {
    return <div className={styles.pop_tip}>
      <div>{title}</div>
      <div>{dataParse(time)}s</div>
    </div>
  }
  const renderDetail = () => {
    return <div className={styles.pop_stats}>
      <div>
        <div>Total duration</div>
        <div>{dataParse(loopTotalTime)}s</div>
      </div>
      <div>
        <div>Number of times</div>
        <div>{curIteration.groups.length}</div>
      </div>
      {curIteration.groups.map((rowItem: any, idx: number) => {
        return <Fragment key={idx}>
          <div className={styles.light}>
            <div>Forward time ({idx < 9 ? '0' : ''}{idx + 1})</div>
            <div>{dataParse(rowItem.forward)}s</div>
          </div>
          <div className={styles.light}>
            <div>Backward time ({idx < 9 ? '0' : ''}{idx + 1})</div>
            <div>{dataParse(rowItem.backward)}s</div>
          </div>
        </Fragment>
      })}
    </div>
  }
  if (!curIteration) {
    return <div className={styles.content}>
      <div className={styles.empty} >
        <div className={styles.empty_icon}></div>
        <div className={styles.empty_tip}>
          Waiting for calculation...
        </div>
      </div >
    </div>
  }
  const { warmup_time, cooldown_time, allreduce_time, start_time } = curIteration
  return (
    <div>
      <div className={styles.result}>
        <div className={styles.result_group}>
          {/*  Timeline */}
          <div className={styles.bm_group_header}>
            <div className={styles.result_group_title}>
              Target iteration
              <span style={{
                paddingLeft: 10,
                paddingTop: 5,
                fontSize: 14,
                fontWeight: 400,
                color: '#909399'
              }}>Total: {bm_result.length}</span>
            </div>
            <div className={styles.result_bm_iteration}>
              <InputNumber
                value={state.ite_index + 1}
                style={{ width: 150 }}
                addonBefore={< MinusOutlined onClick={() => {
                  setState({
                    ite_index: state.ite_index > 0 ? state.ite_index - 1 : state.ite_index
                  })
                }} />}
                addonAfter={<PlusOutlined onClick={() => {
                  setState({
                    ite_index: state.ite_index < bm_result.length - 1 ? state.ite_index + 1 : state.ite_index
                  })
                }} />}
                defaultValue={1}
                controls={false}
                step={1}
                min={1}
                max={bm_result.length}
              />
            </div>
          </div>
        </div>
        <Divider />
        <div className={styles.result_group}>
          {/*  Timeline */}
          <div className={styles.result_group_header}>
            <div className={styles.result_group_title}>
              Timeline
            </div>
          </div>
        </div>
        <div className={styles.timeline_group_total}>
          {dataParse(totalTime)}s
        </div>
        <div className={styles.timeline_group}>
          <Popover content={renderTip(start_time, COLOR_MAPPING['start'].label)} title="" trigger="hover">
            <div className={styles.timeline_block} style={{
              width: calcLength(start_time),
              backgroundColor: COLOR_MAPPING['start'].color
            }}>
            </div>
          </Popover>
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
          <Popover content={renderTip(allreduce_time, COLOR_MAPPING['allReduce'].label)} title="" trigger="hover" placement='left'>
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
            return <Popover content={['forward', 'backward'].indexOf(key) > -1 ? renderDetail() : renderTip(curIteration[item.key], item.label)} title="" trigger="hover" key={key}>
              <div key={key}>
                <div className={styles.timeline_legend_item} style={{ backgroundColor: item.color }}></div>
                <span>{item.label}</span>
              </div>
            </Popover>
          })}
        </div>
      </div>
    </div >
  );
};

export default BenchMark;
