import { FC, useEffect } from 'react';
import { useImmer } from 'use-immer';
import { Select, Divider, InputNumber, Slider } from 'antd'
import Empty from '../empty';
import useModel from 'flooks';
import { getGpuList } from '@/services'
import ProjectModel from '@/models/projectModel';
import styles from './index.less';
import LogModel from '@/models/logModel';

const PARAMS_LIST = [
  {
    title: 'GPU Type',
    key: 'name'
  },
  {
    title: 'Sparse Tensor FP16 Processing power(Tflops)',
    key: 'sparse_tensor_fp16_processing_power'
  }, {
    title: 'FP32 Processing power(Tflops)',
    key: 'fp32_processing_power'
  },
  {
    title: 'Memory(GB)',
    key: 'memory'
  },
  {
    title: 'Memory Bandwidth(GB/s)',
    key: 'memory_bandwidth'
  },
  {
    title: 'Bus Bandwidth(GB/s)',
    key: 'bus_bandwidth'
  }, {
    title: 'Delay(us)',
    key: 'delay'
  }, {
    title: 'Launch MSRP (USD)',
    key: 'launch_msrp'
  }
]
const SLIDER_LIST = [{
  title: 'Per-host network bandwidth(Gb/s)',
  key: 'network_bandwidth',
  min: 1,
  max: 1600,
  precision: 1,
  step: 1
}]
export interface IGPUSelectionProps { }
const GpuSelection: FC<IGPUSelectionProps> = (props) => {
  const { setProject, curGpu } = useModel(ProjectModel);
  const { setChangeLog } = useModel(LogModel);

  const handleItemClick = (key: string, item: any) => {
    setChangeLog('GPU', item?.name, curGpu?.name)
    setProject({
      curGpu: {
        ...item,
        network_bandwidth: curGpu?.network_bandwidth
      }
    });
  };

  const [state, setState] = useImmer({
    GPU_LIST: [],
  });

  const loadGpuList = async () => {
    const gpuRes: any = await getGpuList()
    const gpuList = gpuRes.map((item: any) => {
      return {
        key: item.name,
        label: item.name,
        value: item.name,
        ...item
      }
    })
    setState({
      GPU_LIST: gpuList
    })
  }
  useEffect(() => {
    loadGpuList()
  }, []);


  return (
    <div className={styles.nest}>
      <p className={styles.section_title}>
        Select GPU
      </p>
      <div className={styles.section_content}>
        <Select
          options={state.GPU_LIST}
          value={curGpu?.value} onChange={handleItemClick}>
        </Select>
      </div>
      <p className={styles.section_title}>
        Parameters
      </p>
      <div>
        {curGpu?.value ?
          <div className={styles.gpu_params}>
            {PARAMS_LIST.map((pItem, _idx) =>
              <div key={_idx}>
                <div className={styles.gpu_params_item}>
                  <div className={styles.gpu_params_label}>{pItem.title}</div>
                  <div className={styles.gpu_params_value}>{curGpu[pItem.key]}</div>
                </div>
                {_idx < PARAMS_LIST.length - 1 && <Divider />}
              </div>)}
          </div>
          :
          <div className={styles.to_tips}>
            <Empty />
          </div>
        }
      </div>
      <div className={styles.group_slider}>
        {SLIDER_LIST.map((cf: any) => {
          return (
            <div className={styles['group-list-item']} key={cf.key}>
              <div className={styles['item-wrapper']}>
                <span>
                  {cf.title}
                </span>
                <InputNumber
                  precision={cf.precision || 0}
                  width={100}
                  min={cf.min}
                  max={cf.max}
                  value={curGpu?.[cf.key]}
                  onChange={(val) => {
                    setProject({ curGpu: { ...curGpu, [cf.key]: val } });
                  }}
                />
              </div>
              <Slider
                min={cf.min}
                max={cf.max}
                onChange={(val) => {
                  setChangeLog(cf.title, val, curGpu?.[cf.key])
                  setProject({ curGpu: { ...curGpu, [cf.key]: val } });
                }}
                value={curGpu?.[cf.key]}
                step={cf.step}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GpuSelection;
