import { FC, useEffect } from 'react';
import { Tooltip, Button, message, Upload } from 'antd';
import { AiIcon } from '@/components';
import { useImmer } from 'use-immer';
import useModel from 'flooks';
import ProjectModel from '@/models/projectModel';
import GpuSelection from './gpus';
import ModelSelection from './models';
import OtherSetting from './others';
import GlobalSetting from './globals'
import FileSaver from 'file-saver'
import CustomSteps from './../custom-steps'
import BenchmarkSteps from './../benchmark-steps'
import { calculate, readFile, getRecommendedConfig, downloadTemplate } from '@/services';
import type { UploadProps } from 'antd';
import { service_base_url } from '@/utils/constant'
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
  {
    id: 'global',
    name: 'Global',
    icon: 'llm-others'
  },
];

export interface IPanelLeftProps { }
const PanelLeft: FC<IPanelLeftProps> = (props) => {
  const [state, setState] = useImmer({
    active: 'gpu',
  });
  const { curMode, curGpu, curModel, otherConfig, totalConfig, setProject,
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
      other_config: otherConfig,
      total_train_config: totalConfig
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
        recommendConfig: {
          ...recommendRes
        },
        otherConfig: {
          ...otherConfig,
          tensor_parallel_degree: recommendRes.recomended_tensor_parallel_degree,
          pipeline_parallel_degree: calcPipelinResonableValue(recommendRes.recomended_pipeline_parallel_degree)
        }
      });
    }
  }
  const exportResultFile = () => {
    downloadTemplate({}).then((res: any) => {
      FileSaver.saveAs(res, "calculator-template.xlsx");
    })
  }
  const upProps: UploadProps = {
    name: 'file',
    action: `${service_base_url}/llm_training_calculator/calculator/upload`,
    showUploadList: false,
    onChange(info) {
      if (info.file.status !== 'uploading') {
        // console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        const res = info.file.response
        setProject({
          result: {
            timeline: { ...res }
          },
          otherConfig: {
            tensor_parallel_degree: res.tensor_parallel_degree,
            pipeline_parallel_degree: res.pipeline_parallel_degree
          }
        });
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };
  const formatBMResult = (res: any[]) => {
    return res.map((items: any[]) => {
      let itemObj = {} as any
      let group = [] as any[]
      let totalTime = 0
      items.forEach((rowItem: any, idx: number) => {
        if (!rowItem || rowItem.length < 2) {
          return
        }
        const label = rowItem[0]
        const time = Number(rowItem[1])
        if (idx > 0 && items[idx - 1][0].indexOf('1F1B') < 0) {
          totalTime += time
        }
        if (label.indexOf('warmup start') > -1) {
          itemObj.start_time = time
        }
        if (label.indexOf('1F1B start') > -1) {
          itemObj.warmup_time = time
        }
        if (label.indexOf('allreduce start') > -1) {
          itemObj.cooldown_time = time
        }
        if (label.indexOf('iteration end') > -1) {
          itemObj.allreduce_time = time
        }
        if (label.indexOf('forward start') > -1) {
          group.push({
            forward: Number(items[idx + 1][1])
          })
        }
        if (label.indexOf('backward start') > -1) {
          group[group.length - 1]['backward'] = Number(items[idx + 1][1])
        }
      })
      itemObj.groups = group
      itemObj.totalTime = totalTime
      return itemObj
    })
  }
  const upBenchProps: UploadProps = {
    name: 'file',
    action: `${service_base_url}/llm_training_calculator/benchmark/upload`,
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        const res = info.file.response
        setProject({
          bm_result: formatBMResult(res)
        });
        console.log('formatBMResult(res)', formatBMResult(res))
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  useEffect(() => {
    refreshRecommend()
  }, [curGpu, curModel, otherConfig.optimization_strategy]);

  if (curMode === 'custom') {
    return <div className={styles.notice}>
      <div className={styles.notice_panel}>
        <div className={styles.notice_title}>
          Customize the computation process
        </div>
        <div className={styles.notice_content}>
          <CustomSteps />
        </div>
      </div>
      <Upload {...upProps}>
        <Button type="primary" className={styles.gen_btn}>
          IMPORT
        </Button>
      </Upload>

      <Button className={styles.gen_btn}
        onClick={() => {
          exportResultFile()
        }}>DOWNLOAD TEMPLATE</Button>
    </div>
  }
  if (curMode === 'benchmark') {
    return <div className={styles.notice}>
      <div className={styles.bm_notice_panel}>
        <div className={styles.notice_title}>
          Benchmark your training with our tracing program:
        </div>
        <div className={styles.notice_content}>
          <BenchmarkSteps />
        </div>
      </div>
      <Upload {...upBenchProps}>
        <Button type="primary" className={styles.gen_btn}>
          IMPORT
        </Button>
      </Upload>
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
          {state.active === 'global' && <GlobalSetting />}
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
