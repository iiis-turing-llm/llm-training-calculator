import { FC, useEffect } from 'react';
import { Tooltip, Button, message, Upload, Switch } from 'antd';
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
import {
  calculate, readFile, getRecommendedTenser, getRecommendedPipeline,
  getRecommendedMicrobatch, downloadTemplate
} from '@/services';
import type { UploadProps } from 'antd';
import { service_base_url } from '@/utils/constant'
import styles from './index.less';
import { debounce, mixin } from 'lodash';
import LogModel from '@/models/logModel';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

export interface IPanelLeftProps { }
const PanelLeft: FC<IPanelLeftProps> = (props) => {
  const { t } = useTranslation();
  const [state, setState] = useImmer({
    active: 'gpu',
  });
  const { curMode, curGpu, curModel, autoRecalc, otherConfig, totalConfig, result, setProject,
    checkSize, checkPipeline, checkTotalConfig, setRecommendConfig } = useModel(ProjectModel);
  // const { changeLog, setAutoCalculated } = useModel(LogModel);
  const { history_results, pushHistory } = useModel(LogModel);
  const itemData = [
    {
      id: 'gpu',
      name: t('cluster'),
      icon: 'llm-gpu'
    },
    {
      id: 'model',
      name: t('models'),
      icon: 'llm-model'
    },
    {
      id: 'others',
      name: t('others'),
      icon: 'llm-others'
    },
    {
      id: 'global',
      name: t('input'),
      icon: 'llm-global'
    },
  ] as any[];
  const handleItemClick = (key: string) => {
    if (key === 'others' && !curGpu) {
      message.warn(`GPU ${t('shouldset')}!`)
      setState({ active: 'gpu' });
      return
    }
    if (key === 'others' && !curModel) {
      message.warn(`Model ${t('shouldset')}!`)
      setState({ active: 'model' });
      return
    }
    if (key === 'others' && !curGpu.network_bandwidth) {
      message.warn(`Per-host network bandwidth ${t('shouldset')}!`)
      setState({ active: 'gpu' });
      return
    }
    if (key === 'others' && !curModel.minibatch_size) {
      message.warn(`Minibatch size ${t('shouldset')}!`)
      setState({ active: 'model' });
      return
    }
    setState({ active: key });
  };

  // && otherConfig.per_host_network_bandwidth
  const validateInput = () => {
    if (state.active == 'gpu') {
      return curGpu && curGpu?.network_bandwidth ? true : false
    }
    if (state.active == 'model') {
      return curModel && curModel.minibatch_size ? true : false
    }
    if (state.active == 'others') {
      if (otherConfig && otherConfig.microbatch_size
        && otherConfig.optimization_strategy
        && otherConfig.tensor_parallel_degree
        && otherConfig.pipeline_parallel_degree) {
        if (checkSize() && checkPipeline()) {
          return true
        }
      }
    }
    if (state.active == 'global' && checkTotalConfig()) {
      return true
    }
    return false
  }
  const genHistoryTitle = () => {
    // return `${curGpu.name}_${curModel.name}_parallel[${totalConfig.data_parallel_degree}, ${otherConfig.pipeline_parallel_degree}, ${otherConfig.tensor_parallel_degree}]
    // _batch_size[${curModel.minibatch_size}, ${otherConfig.microbatch_size}]`
    return `${curGpu.name}_${curModel.name}`
  }
  const doCalculate = async () => {
    setProject({
      loading: true
    });
    const params = {
      cluster: curGpu,
      model: curModel,
      other_config: otherConfig,
      input_config: totalConfig
    }
    const calcRes: any = await calculate({
      ...params
    })
    setProject({
      latest_result: autoRecalc ? { ...result } : null,
      result: calcRes
    });
    pushHistory('guide', { ...calcRes, other_config: otherConfig }, genHistoryTitle(),
      {
        ...params
      }
    )
    setTimeout(() => {
      setProject({
        loading: false
      });
    }, 300)
  }
  const doCalculateOrNext = () => {
    if (state.active === 'global') {
      doCalculate()
    } else {
      const curModeIndex = itemData.findIndex((item: any) => item.id === state.active)
      handleItemClick(itemData[curModeIndex + 1].id)
    }
  }
  // const readExcelFile = async () => {
  //   const readRes = await readFile()
  //   setProject({
  //     result: {
  //       timeline: readRes
  //     }
  //   });
  // }
  // const calcPipelinResonableValue = (recommendVal: number) => {
  //   const modelLayers = curModel.num_layers
  //   if (modelLayers % recommendVal === 0) {
  //     return recommendVal
  //   } else {
  //     for (let i = recommendVal; i < modelLayers; i++) {
  //       if (modelLayers % i === 0) {
  //         return i
  //       }
  //     }
  //     return modelLayers
  //   }
  // }
  const refreshRecommendTensor = async () => {
    if (curGpu?.name && curGpu?.network_bandwidth && curModel?.minibatch_size) {
      const recommendRes: any = await getRecommendedTenser({
        cluster: curGpu,
        model: curModel,
        optimization_strategy: otherConfig.optimization_strategy
      })
      setRecommendConfig('recomended_tensor_parallel_degree', recommendRes);
    }
  }
  const refreshRecommendPipeline = async () => {
    if (curGpu?.name && curModel?.minibatch_size && otherConfig.tensor_parallel_degree) {
      const recommendRes: any = await getRecommendedPipeline({
        cluster: curGpu,
        model: curModel,
        optimization_strategy: otherConfig.optimization_strategy,
        tensor_parallel_degree: otherConfig.tensor_parallel_degree
      })
      setRecommendConfig(
        'recomended_pipeline_parallel_degree', recommendRes
      );
    }
  }
  const refreshRecommendMicrobatch = async () => {
    if (curModel?.minibatch_size && otherConfig.pipeline_parallel_degree) {
      const recommendRes: any = await getRecommendedMicrobatch({
        model: curModel,
        pipeline_parallel_degree: otherConfig.pipeline_parallel_degree
      })
      setRecommendConfig(
        'recomended_microbatch', recommendRes
      );
    }
  }
  const exportResultFile = () => {
    downloadTemplate({}).then((res: any) => {
      FileSaver.saveAs(res, "calculator-template.xlsx");
    })
  }
  const cleanFileName = (nameStr: string) => {
    return nameStr.split('.')[0]
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
            ...res
          },
          // otherConfig: {
          //   tensor_parallel_degree: res.tensor_parallel_degree,
          //   pipeline_parallel_degree: res.pipeline_parallel_degree
          // }
        });
        pushHistory('custom', {
          ...res
        }, cleanFileName(info.file.name))
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
        if (idx > 0) { // && items[idx - 1][0].indexOf('1F1B') < 0
          totalTime += time
        }
        if (label.indexOf('warmup start') > -1) {
          itemObj.start_time = time
          itemObj.warmup_time = Number(items[idx + 1][1])
        }
        // if (label.indexOf('1F1B start') > -1) {
        //   itemObj.warmup_time = time
        // }
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
        const formatRes = formatBMResult(res)
        setProject({
          bm_result: formatRes
        });
        pushHistory('benchmark', formatRes, cleanFileName(info.file.name))
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  useEffect(() => {
    refreshRecommendTensor()
    refreshRecommendPipeline()
    refreshRecommendMicrobatch()
  }, [curGpu?.name, curGpu?.network_bandwidth, curModel?.name, curModel?.minibatch_size]);
  useEffect(() => {
    refreshRecommendPipeline()
  }, [otherConfig?.optimization_strategy, otherConfig?.tensor_parallel_degree]);
  useEffect(() => {
    refreshRecommendMicrobatch()
  }, [otherConfig?.pipeline_parallel_degree]);

  useEffect(() => {
    if (validateInput() && autoRecalc) {
      debounce(doCalculate, 200)()//消抖
      // setAutoCalculated()
      // message.success(`${changeLog.field} changed!`)
    }
  }, [curGpu, curModel, otherConfig, totalConfig]);
  if (curMode === 'custom') {
    return <div className={styles.notice}>
      <div className={styles.notice_panel}>
        <div className={styles.notice_title}>
          {t('custom process')}
          {/* Customize the computation process */}
        </div>
        <div className={styles.notice_content}>
          <CustomSteps />
        </div>
      </div>
      <Upload {...upProps}>
        <Button type="primary" className={styles.gen_btn}>
          {t('import')}
        </Button>
      </Upload>

      <Button className={styles.gen_btn}
        onClick={() => {
          exportResultFile()
        }}>
        {/* DOWNLOAD TEMPLATE */}
        {t('download tem')}
      </Button>
    </div>
  }
  if (curMode === 'benchmark') {
    return <div className={styles.notice}>
      <div className={styles.bm_notice_panel}>
        <div className={styles.notice_title}>
          {/* Benchmark your training with our tracing program: */}
          {t('benchmark progress')}
        </div>
        <div className={styles.notice_content}>
          <BenchmarkSteps />
        </div>
      </div>
      <Upload {...upBenchProps}>
        <Button type="primary" className={styles.gen_btn}>
          {/* IMPORT */}
          {t('import')}
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
          <div className={styles.area_switch}>
            <Switch checked={autoRecalc}
              onChange={(check: boolean) => {
                setProject({
                  autoRecalc: check
                });
              }}></Switch>
            <span style={{ color: autoRecalc ? '#1989FA' : '' }}>
              {t('autocalc')}</span>
          </div>
          <Button type="primary"
            disabled={!validateInput()}
            className={styles.area_btn_btn}
            onClick={doCalculateOrNext}>
            {state.active === 'global' ? t('calculate') : t('next')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PanelLeft;
