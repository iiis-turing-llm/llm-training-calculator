import {
  Button,
  InputNumber,
  Slider,
  Popover
} from 'antd';
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';
import { InfoCircleOutlined } from '@ant-design/icons';
import LogModel from '@/models/logModel';

const SRATEGY_LIST = [
  {
    label: 'No recomputation',
    value: 'No recomputation'
  },
  {
    label: 'Selective recomputation',
    value: 'Selective recomputation'
  },
  {
    label: 'Full recomputation',
    value: 'Full recomputation'
  },
];

const PARAMS_LIST = [
  {
    title: 'Tensor parallel degree',
    key: 'tensor_parallel_degree',
    min: 1,
    max: 8,
    precision: 0,
    step: 1
  },
  {
    title: 'Pipeline parallel degree',
    key: 'pipeline_parallel_degree',
    min: 1,
    max: 10000,
    precision: 0,
    step: 1

  },
  // {
  //   title: 'Per-host network bandwidth(Gb/s)',
  //   key: 'network_bandwidth',
  //   min: 1,
  //   max: 1600,
  //   precision: 1,
  //   step: 1
  // }
]
const OtherPanel = (props: any) => {
  const { setProject, setOtherConfig, otherConfig, recommendConfig, curModel, curGpu,
    checkSize, checkPipeline } = useModel(ProjectModel);
  const { setChangeLog } = useModel(LogModel);
  const setParamValue = (key: string, val: any, title?: string) => {
    setChangeLog(title, val, otherConfig?.[key])
    setOtherConfig({
      [key]: val
    });
  };
  const calcMin = (cf: any) => {
    if (cf.key === 'pipeline_parallel_degree') {
      return recommendConfig.recomended_pipeline_parallel_degree
    }
    return cf.min
  }
  const calcMax = (cf: any) => {
    if (cf.key === 'pipeline_parallel_degree') {
      return curModel?.num_layers
    }
    if (cf.key === 'tensor_parallel_degree') {
      // return recommendConfig.recomended_tensor_parallel_degree
      return 8
    }
    return cf.max
  }
  const closeErrorMsg = () => {
    setProject({
      errorMsg: null,
      showError: false
    })
  }
  return (
    <div className={styles.nest}>
      <p className={styles.section_title}>
        Optimization Strategy
      </p>
      <div className={styles['group-content']}>
        {SRATEGY_LIST.map((m: any) => {
          return (
            <Button
              key={m.value}
              size="small"
              value="line"
              className={`${styles['mode-btn']} ${otherConfig.optimization_strategy === m.value ? styles['active'] : ''
                }`}
              onClick={(e) => {
                setParamValue('optimization_strategy', m.value, 'Optimization Strategy')
              }}
            >
              {m.label}
            </Button>
          );
        })}
      </div>
      <div className={styles['group_slider']}>
        {PARAMS_LIST.map((cf: any) => {
          return (
            <div className={styles['group-list-item']} key={cf.key}>
              <div className={styles['item-wrapper']}>
                <span>
                  {cf.title}
                  {/* <Tooltip placement="top" title={cf.description}>
                      <QuestionCircleFilled
                        style={{ paddingLeft: 10, cursor: 'pointer' }}
                      />
                    </Tooltip> */}
                </span>
                <InputNumber
                  precision={cf.precision || 0}
                  width={100}
                  min={calcMin(cf)}
                  max={calcMax(cf)}
                  value={otherConfig[cf.key]}
                  onChange={(val) => {
                    setParamValue(cf.key, val, cf.title)
                  }}
                />
              </div>
              {cf.key === 'tensor_parallel_degree' &&
                <div className={styles.slider_tip}>
                  No larger than recommended value (<b>{recommendConfig?.recomended_tensor_parallel_degree}</b>) to balance GPU communication/computation time.</div>}
              {cf.key === 'pipeline_parallel_degree' && otherConfig.tensor_parallel_degree &&
                <div className={styles.slider_tip}>
                  {recommendConfig.recomended_pipeline_parallel_degree > 0 ?
                    <span>No smaller than  recommended value (<b>{recommendConfig.recomended_pipeline_parallel_degree}</b>) to avoid OOM</span>
                    :
                    <span style={{ color: '#ff4d4f' }}>Activation out of memory, try to increase Tensor parallel degree or decrease minibatch size</span>
                  }</div>}
              <Slider
                min={cf.min}
                max={cf.key === 'pipeline_parallel_degree' ? curModel?.num_layers : cf.max}
                onChange={(val) => {
                  setParamValue(cf.key, val, cf.title)
                }}
                value={otherConfig[cf.key]}
                step={cf.step}
              />
              {cf.key === 'pipeline_parallel_degree' && !checkPipeline() && curModel?.minibatch_size && <div className={styles.error_tip}>
                Need to be able to divide number of model layers({curModel?.num_layers}).
              </div>}
            </div>
          );
        })}
      </div>
      <p className={styles.section_title}>
        Microbatch size
      </p>
      <div className={styles.section_content}>
        {recommendConfig.recomended_microbatch && <div className={styles.slider_tip}>
          No larger than  recommended value (<b>{recommendConfig.recomended_microbatch}</b>) to reduce pipeline bubble time.</div>}
        <InputNumber
          className={styles.number_item}
          precision={0}
          min={0}
          max={recommendConfig.recomended_microbatch || curModel?.minibatch_size}
          value={otherConfig?.microbatch_size}
          onChange={(val) => setParamValue('microbatch_size', val, 'Microbatch size')}
          addonAfter={<Popover
            content={<div>
              Need to be able to divide minibatch size.
            </div>}>
            <InfoCircleOutlined style={{ cursor: 'pointer' }} />
          </Popover>}>
        </InputNumber>
        {!checkSize() && curModel?.minibatch_size && <div className={styles.error_tip}>Need to be able to divide minibatch size({curModel?.minibatch_size}).</div>}
      </div>
    </div>
  );
};

export default OtherPanel;
