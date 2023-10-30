import { FC, useEffect } from 'react';
import { Tooltip, Button, message } from 'antd';
import { AiIcon } from '@/components';
import { useImmer } from 'use-immer';
import useModel from 'flooks';
import ProjectModel from '@/models/projectModel';
import GpuSelection from './gpus';
import ModelSelection from './models';
import OtherSetting from './others';
import { calculate, readFile, getRecommendedConfig } from '@/services';
import { CUSTOM_FILENAME, CUSTOM_FILEPATH, CUSTOM_SHEET } from '@/utils/constant'
import styles from './index.less';

const itemData = [
  {
    id: 'gpu',
    name: 'GPUs',
    icon: 'llm-gpu'
  },
  {
    id: 'model',
    name: 'Models',
    icon: 'llm-model'
  },
  {
    id: 'others',
    name: 'Others',
    icon: 'llm-others'
  },
];

export interface IPanelLeftProps { }
const PanelLeft: FC<IPanelLeftProps> = (props) => {
  const [state, setState] = useImmer({
    active: 'gpu',
  });
  const { curMode, curGpu, curModel, otherConfig, setProject,
    checkSize, checkPipeline } = useModel(ProjectModel);
  const handleItemClick = (key: string) => {
    if (key === 'others' && !curGpu) {
      message.warn('GPU should be set!')
      setState({ active: 'gpu' });
      return
    }
    if (key === 'others' && !curModel) {
      message.warn('Model should be set!')
      setState({ active: 'model' });
      return
    }
    if (key === 'others' && !curModel.minibatch_size) {
      message.warn('Minibatch size should be set!')
      setState({ active: 'model' });
      return
    }
    setState({ active: key });
  };

  // && otherConfig.per_host_network_bandwidth
  const validateInput = () => {
    if (curGpu && curModel &&
      otherConfig.microbatch_size
      && otherConfig.optimization_strategy
      && otherConfig.tensor_parallel_degree
      && otherConfig.pipeline_parallel_degree
      && otherConfig.network_bandwidth) {
      if (checkSize() && checkPipeline()) {
        return true
      }
    }
    return false
  }
  const doCalculate = async () => {
    const calcRes = await calculate({
      gpu: curGpu,
      model: curModel,
      other_config: otherConfig
    })
    setProject({
      result: calcRes
    });
  }
  const readExcelFile = async () => {
    const readRes = await readFile()
    setProject({
      result: {
        timeline: readRes
      }
    });
  }
  const calcPipelinResonableValue = (recommendVal: number) => {
    const modelLayers = curModel.num_layers
    if (modelLayers % recommendVal === 0) {
      return recommendVal
    } else {
      for (let i = recommendVal; i < modelLayers; i++) {
        if (modelLayers % i === 0) {
          return i
        }
      }
      return modelLayers
    }
  }
  const refreshRecommend = async () => {
    if (curModel?.minibatch_size) {
      const recommendRes: any = await getRecommendedConfig({
        gpu: curGpu,
        model: curModel,
        optimization_strategy: otherConfig.optimization_strategy
      })
      setProject({
        otherConfig: {
          ...otherConfig,
          tensor_parallel_degree: recommendRes.recomended_tensor_parallel_degree,
          pipeline_parallel_degree: calcPipelinResonableValue(recommendRes.recomended_pipeline_parallel_degree)
        }
      });
    }
  }

  useEffect(() => {
    refreshRecommend()
  }, [curGpu, curModel, otherConfig.optimization_strategy]);

  if (curMode === 'custom') {
    return <div className={styles.notice}>
      <div className={styles.notice_panel}>
        <div className={styles.notice_title}>
          Notice
        </div>
        <div className={styles.notice_content}>
          Customize the computation process using our excel tool [{CUSTOM_FILENAME}] in [{CUSTOM_FILEPATH}]
          and provide required intermediate computation results in [{CUSTOM_SHEET}].
        </div>
      </div>
      <Button type="primary" className={styles.gen_btn}
        onClick={() => {
          readExcelFile()
        }}>READ EXCEL & CALCULATE</Button>
    </div>
  }

  return (
    <div className={styles.slider}>
      <div className={styles.toolbar}>
        {itemData.map((item) => {
          return (
            <Tooltip key={item.id} placement="right" title={item.name}>
              <div
                onClick={() => handleItemClick(item.id)}
                className={`${styles.item} ${state.active === item.id ? styles.active : ''
                  }`}
              >
                <div>
                  <AiIcon type={item.icon} style={{
                    fontSize: 16,
                    padding: 10,
                    // color: state.active === item.id ? '#3893FF' : '#303133;',
                    background: state.active === item.id ? 'rgba(5,130,255,0.1)' : '#E1E2E6',
                    borderRadius: 20,
                  }} />
                </div>
                <div>{item.name}</div>
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div className={styles.area}>
        <div className={styles.area_params}>
          {state.active === 'gpu' && <GpuSelection />}
          {state.active === 'model' && <ModelSelection />}
          {state.active === 'others' && <OtherSetting />}
        </div>
        <div className={styles.area_btn}>
          <Button type="primary"
            disabled={!validateInput()}
            className={styles.area_btn_btn}
            onClick={doCalculate}
          >CALCUTATE</Button>
        </div>
      </div>
    </div>
  );
};

export default PanelLeft;
