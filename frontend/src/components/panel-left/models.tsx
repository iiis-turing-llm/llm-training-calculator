import { FC, useEffect } from 'react';
import { useImmer } from 'use-immer';
import { Select, Divider, InputNumber } from 'antd'
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';
import { getModelList, getParameterMetrics, getRecommendedConfig } from '@/services';
import Empty from '../empty';

const PARAMS_LIST = [
  {
    title: 'Model Type',
    key: 'name'
  },
  {
    title: 'Token length',
    key: 'token_length'
  }, {
    title: 'Number of attention heads',
    key: 'num_attention_heads'
  },
  {
    title: 'Hidden layer size',
    key: 'hidden_layer_size'
  },
  {
    title: 'Number of layers',
    key: 'num_layers'
  },
  {
    title: 'Vocabulary size',
    key: 'vocab_size'
  }
  // minibatch_size
]

const NUM_PARAMS_LIST = [
  {
    title: 'Total parameters',
    key: 'total_parameters'
  },
  {
    title: 'Word embedding',
    key: 'word_embedding'
  }, {
    title: 'Self attention',
    key: 'self_attention'
  },
  {
    title: 'Feed forward',
    key: 'feed_forward'
  },
  {
    title: 'Position embedding',
    key: 'position_embedding'
  }
]

export interface IModelSelectionProps { }
const ModelSelection: FC<IModelSelectionProps> = (props) => {
  const { setProject, curModel, curGpu, otherConfig, modelMetrics } = useModel(ProjectModel);

  const handleItemClick = (key: string, item: any) => {
    setProject({
      curModel: {
        ...item,
        minibatch_size: curModel?.minibatch_size
      }
    });
  };

  const [state, setState] = useImmer({
    MODEL_LIST: [] as any[]
  });

  const loadModelList = async () => {
    const modelRes: any = await getModelList()
    setState({
      ...state,
      MODEL_LIST: modelRes.map((item: any) => {
        return {
          key: item.name,
          label: item.name,
          value: item.name,
          ...item
        }
      })
    })
  }
  const loadMetricsOfModel = async () => {
    if (!curModel) {
      return
    }
    const metricsRes: any = await getParameterMetrics({
      ...curModel
    })
    setProject({
      modelMetrics: { ...metricsRes }
    });
  }
  useEffect(() => {
    loadMetricsOfModel()
  }, [curModel]);

  useEffect(() => {
    loadModelList()
  }, []);



  return (
    <div className={styles.model_wrapper}>
      <p className={styles.section_title}>
        Select Model
      </p>
      <div className={styles.section_content}>
        <Select options={state.MODEL_LIST} value={curModel?.value} onChange={handleItemClick}>
        </Select>
      </div>
      <p className={styles.section_title}>
        Minibatch size
      </p>
      <div className={styles.section_content}>
        <InputNumber
          className={styles.number_item}
          precision={0}
          min={0}
          value={curModel?.minibatch_size}
          onChange={(val) => setProject({
            curModel: {
              ...curModel,
              minibatch_size: val
            }
          })} >
        </InputNumber >
      </div >
      <p className={styles.section_title}>
        Parameters
      </p>
      <div>
        {curModel?.value ?
          <div className={styles.gpu_params}>
            {PARAMS_LIST.map((pItem, _idx) =>
              <div key={_idx}>
                <div className={styles.gpu_params_item}>
                  <div className={styles.gpu_params_label}>{pItem.title}</div>
                  <div className={styles.gpu_params_value}>{curModel[pItem.key]}</div>
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
      <p className={styles.section_title}>
        The number of parameters of models
      </p>
      <div>
        {curModel?.value && modelMetrics ?
          <div className={styles.gpu_params}>
            {NUM_PARAMS_LIST.map((pItem, _idx) =>
              <div key={_idx}>
                <div className={styles.gpu_params_item}>
                  <div className={styles.gpu_params_label}>{pItem.title}</div>
                  <div className={styles.gpu_params_value}>{modelMetrics[pItem.key]}</div>
                </div>
                {_idx < NUM_PARAMS_LIST.length - 1 && <Divider />}
              </div>)}
          </div>
          :
          <div className={styles.to_tips}>
            <Empty />
          </div>
        }
      </div>
    </div >
  );
};

export default ModelSelection;
