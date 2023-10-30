import { FC, useEffect } from 'react';
import { useImmer } from 'use-immer';
import { Select, Divider } from 'antd'
import Empty from '../empty';
import useModel from 'flooks';
import { getGpuList } from '@/services'
import ProjectModel from '@/models/projectModel';
import styles from './index.less';

const PARAMS_LIST = [
  {
    title: 'GPU Type',
    key: 'name'
  },
  {
    title: 'Sparse Tensor FP16 Processing power',
    key: 'sparse_tensor_fp16_processing_power'
  }, {
    title: 'FP32 Processing power',
    key: 'fp32_processing_power'
  },
  {
    title: 'Memory',
    key: 'memory'
  },
  {
    title: 'Memory Bandwidth',
    key: 'memory_bandwidth'
  },
  {
    title: 'Bus Bandwidth',
    key: 'bus_bandwidth'
  }, {
    title: 'Delay',
    key: 'delay'
  }, {
    title: 'Launch MSRP (USD)',
    key: 'launch_msrp'
  }
]
export interface IGPUSelectionProps { }
const GpuSelection: FC<IGPUSelectionProps> = (props) => {
  const { setProject, curGpu } = useModel(ProjectModel);

  const handleItemClick = (key: string, item: any) => {
    setProject({ curGpu: item });
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
    <div className={styles.gpu_wrapper}>
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
    </div>
  );
};

export default GpuSelection;
