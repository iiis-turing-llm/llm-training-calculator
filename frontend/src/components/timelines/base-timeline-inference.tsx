import { FC, Fragment } from 'react';
import { Divider, Popover } from 'antd'
import styles from './index.less';
import PopPanel from './pops-inference'
import { keys, sum } from 'lodash';
const COLOR_MAPPING: any = {
    forward: {
        label: 'Forward time',
        color: '#92CC76',
        key: 'forward_time'
    },
    p2p: {
        label: 'P2P Time ',
        color: '#FAC858',
        key: 'total_p2p_time'
    },
    cpu: {
        label: 'Cpu Delay',
        color: '#AAE7FF',
        key: 'total_cpu_delay'
    },
}

export interface IBaseTLProps {
    result: any,
    latest_result?: any,
    widthScale?: string,
    curMode: string
}
const BaseTLInference: FC<IBaseTLProps> = (props) => {
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
    const { forward_time, num_microbatches } = result?.infer_timeline || {}

    const { total_forward_allgather_time, total_forward_reduce_scatter_time, total_cpu_delay, total_p2p_time } = result?.infer_communication || {}
    const { total_forward_gpu_time } = result?.infer_computation || {}

    const calcL = (time: number) => {
        const oneLength = 100 / num_microbatches;
        return `${(time / (forward_time * num_microbatches) * oneLength)}%`
    }
    const checkChanged = (val: any, preVal: any) => {
        if (curMode !== 'inference') {
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
                width: calcL(total_forward_gpu_time + total_forward_allgather_time + total_forward_reduce_scatter_time),
                backgroundColor: COLOR_MAPPING['forward'].color
            }}>
            </div>
            <div key={`${index}_1`} className={styles.timeline_inner_block} style={{
                width: calcL(total_p2p_time),
                backgroundColor: COLOR_MAPPING['p2p'].color
            }}>
            </div>
            <div key={`${index}_2`} className={styles.timeline_inner_block} style={{
                width: calcL(total_cpu_delay),
                backgroundColor: COLOR_MAPPING['cpu'].color
            }}>
            </div>

        </Fragment>
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
            {/* <div>{title}(GPU usage)</div> */}
            {/* <div>{dataParse(time)} ({((time / totalTime) * 100).toFixed(2)}%)</div> */}
            {/* <div>{dataParse(time)} (0%)</div> */}
            <div>{title}</div>
            <div>{dataParse(time)}s</div>
        </div>
    }
    const renderDetail = () => {
        return <PopPanel result={result} otherConfig={result.other_config} />
    }

    return (
        <div>
            <div className={styles.timeline_group_total} style={{ width: props.widthScale || '100%' }}>
                {/* {dataParse(totalTime)}s */}
                <span className={styles.timeline_total_label}>Per Token Delay</span>
                <span className={checkChanged(result.infer_timeline.per_token_delay, latest_result?.infer_timeline?.per_token_delay)}>
                    {dataParse(result.infer_timeline.per_token_delay)}s
                </span>
                <Divider type="vertical" />
                <span className={styles.timeline_total_label}> First Token Delay</span>
                <span className={checkChanged(result.infer_timeline.first_token_delay, latest_result?.infer_timeline?.first_token_delay)}>
                    {dataParse(result.infer_timeline.first_token_delay)}
                </span>
                <Divider type="vertical" />
                <span className={styles.timeline_total_label}> Total duration</span>
                <span className={checkChanged(result.infer_total_time.total_inference_time, latest_result?.infer_total_time?.total_inference_time)}>
                    {dataParse(result.infer_total_time.total_inference_time)}s
                </span>
            </div>
            <div className={styles.timeline_group} style={{ width: props.widthScale || '100%' }}>

                {/* <Popover content={renderTip(warmup_time, COLOR_MAPPING['warmup'].label)} title="" trigger="hover">
                    <div className={styles.timeline_block} style={{
                        width: calcLength(warmup_time),
                        backgroundColor: COLOR_MAPPING['warmup'].color
                    }}>
                    </div>
                </Popover> */}
                {/* forward和backward Time */}
                <Popover content={renderDetail()} title="" trigger="hover">
                    {/* <div className={styles.timeline_block_loop} style={{ width: calcLength(loopTotalTime) }}> */}
                    <div className={styles.timeline_block_loop} style={{ width: '100%' }}>
                        {renderMultiLoopTime()}
                    </div>
                </Popover>

                {/* <Popover content={renderTip(cooldown_time, COLOR_MAPPING['cooldown'].label)} title="" trigger="hover">
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
                </Popover> */}

            </div>
            {/* 下面的是图例 */}
            <div className={styles.timeline_group_legend}>
                {keys(COLOR_MAPPING).map((key: string) => {
                    const item = COLOR_MAPPING[key]
                    // if (!result.infer_timeline[item.key]) {
                    //     return
                    // }
                    return <Popover content={key === "forward" ? renderDetail() : renderTip(result.infer_communication[item.key], item.label)
                    } title="" trigger="hover" key={key}>
                        <div key={key}>
                            <div className={styles.timeline_legend_item} style={{ backgroundColor: item.color }}></div>
                            <span>{item.label}</span>
                        </div>
                    </Popover>
                    // return <Popover content={['forward', 'backward'].indexOf(key) > -1 ? renderDetail() : renderTip(result.infer_timeline[item.key], item.label)
                    // } title="" trigger="hover" key={key}>
                    //     <div key={key}>
                    //         <div className={styles.timeline_legend_item} style={{ backgroundColor: item.color }}></div>
                    //         <span>{item.label}</span>
                    //     </div>
                    // </Popover>
                })}
            </div>
        </div>
    );
};

export default BaseTLInference;
