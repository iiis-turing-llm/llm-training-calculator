import {
  Button,
  InputNumber,
  Slider,
  Popover,
  Alert
} from 'antd';
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';
import { InfoCircleOutlined } from '@ant-design/icons';

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
  {
    title: 'Per-host network bandwidth',
    key: 'network_bandwidth',
    min: 1,
    max: 1600,
    precision: 1,
    step: 1
  }
]
const OtherPanel = (props: any) => {
  const { setProject, setOtherConfig, otherConfig, curModel, curGpu,
    checkSize, checkPipeline, showError, errorMsg } = useModel(ProjectModel);

  const setParamValue = (key: string, val: any) => {
    setOtherConfig({
      [key]: val
    });
  };
  const closeErrorMsg = () => {
    setProject({
      errorMsg: null,
      showError: false
    })
  }
  return (
    <div className={styles.nest}>
      <p className={styles.section_title}>
        Microbatch size
      </p>
      <div className={styles.section_content}>
        <InputNumber
          className={styles.number_item}
          precision={0}
          min={0}
          max={curModel?.minibatch_size}
          value={otherConfig?.microbatch_size}
          onChange={(val) => setParamValue('microbatch_size', val)}
          addonAfter={<Popover
            content={<div>
              Need to be able to divide minibatch size.
            </div>}>
            <InfoCircleOutlined style={{ cursor: 'pointer' }} />
          </Popover>}>
        </InputNumber>
        {!checkSize() && curModel?.minibatch_size && <div className={styles.error_tip}>Need to be able to divide minibatch size({curModel?.minibatch_size}).</div>}
      </div>
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
              onClick={(e) => setParamValue('optimization_strategy', m.value)}
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
                  min={cf.min}
                  max={cf.key === 'pipeline_parallel_degree' ? curModel?.num_layers : cf.max}
                  value={otherConfig[cf.key]}
                  onChange={(val) => {
                    setParamValue(cf.key, val)
                  }}
                />
              </div>
              <Slider
                min={cf.min}
                max={cf.key === 'pipeline_parallel_degree' ? curModel?.num_layers : cf.max}
                onChange={(val) => {
                  setParamValue(cf.key, val)
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
      {showError && <Alert
        message={errorMsg}
        type="warning"
        closable
        onClose={closeErrorMsg}
      />}
    </div>
  );
};

export default OtherPanel;
