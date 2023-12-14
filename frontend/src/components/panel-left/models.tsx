import { FC, useEffect } from 'react';
import { useImmer } from 'use-immer';
import { Select, Divider, InputNumber, Input, Drawer, Button, message } from 'antd'
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';
import { getModelList, getParameterMetrics } from '@/services';
import Empty from '../empty';
import LogModel from '@/models/logModel';
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next';

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
  const { setProject, curModel, modelMetrics } = useModel(ProjectModel);
  const { setChangeLog } = useModel(LogModel);
  const { t } = useTranslation();

  const handleItemClick = (key: string, item: any) => {
    setChangeLog('Model', item?.name, curModel?.name)
    setProject({
      curModel: {
        ...item,
        minibatch_size: curModel?.minibatch_size || 32
      }
    });
  };

  const [state, setState] = useImmer({
    MODEL_LIST: [] as any[],
    showAddModal: false,
    newModel: {} as any
  });

  const loadModelList = async () => {
    const localItems = JSON.parse(localStorage.getItem('local_models') || '[]') || []
    const modelRes: any = await getModelList()
    setState({
      ...state,
      MODEL_LIST: [...modelRes.map((item: any) => {
        return {
          key: item.name,
          label: item.name,
          value: item.name,
          ...item
        }
      }), ...localItems]
    })
  }
  const showAddModal = () => {
    setState({
      ...state,
      showAddModal: true
    })
  }
  const closeAddModal = () => {
    setState({
      ...state,
      showAddModal: false
    })
  }
  const setNewModel = (newItem: any) => {
    setState({
      ...state,
      newModel: newItem
    })
  }
  const addItemToList = () => {
    const isNotComplete = PARAMS_LIST.find((p => !state.newModel[p.key]))
    if (isNotComplete) {
      message.warn('Please fill it out completely!')
      return
    }
    const newItem = {
      ...state.newModel,
      key: state.newModel.name,
      label: state.newModel.name,
      value: state.newModel.name,
    }
    const newModelList = [...state.MODEL_LIST, newItem]
    setState({
      ...state,
      MODEL_LIST: newModelList,
      showAddModal: false
    })
    setProject({
      curModel: {
        ...newItem,
        minibatch_size: curModel?.minibatch_size || 32
      }
    });
    const localItems = JSON.parse(localStorage.getItem('local_models') || '[]') || []
    localStorage.setItem('local_models', JSON.stringify([...localItems, newItem]))
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
        {t('select title')} Model
      </p>
      <div className={styles.section_content}>
        <Select options={state.MODEL_LIST} value={curModel?.value}
          onChange={handleItemClick}
          dropdownRender={(menu) => (
            <>
              {menu}
              <Divider />
              <Button type="link" icon={<PlusOutlined />}
                style={{ padding: '0 10px' }}
                onClick={showAddModal}>
                {t('add item')}
              </Button>
            </>
          )}
        >
        </Select>
      </div>
      <p className={styles.section_title}>
        {/* Minibatch size */}
        {t('minibatch')}
      </p>
      <div className={styles.section_content}>
        <InputNumber
          className={styles.number_item}
          precision={0}
          min={0}
          value={curModel?.minibatch_size}
          onChange={(val) => {
            setChangeLog('Minibatch size', val, curModel?.minibatch_size)
            setProject({
              curModel: {
                ...curModel,
                minibatch_size: val
              }
            })
          }} >
        </InputNumber >
      </div >
      <p className={styles.section_title}>
        {/* Parameters */}
        {t('parameters')}
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
        {/* The number of parameters of models */}
        {t('model params number')}
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
      <Drawer title={t('add item')} placement="right" width={600}
        // getPopupContainer={(node: any) => {
        //   if (node) {
        //     return node.parentNode;
        //   }
        //   return document.body;
        // }}
        onClose={closeAddModal}
        open={state.showAddModal}>
        <div className="gpu_params">
          {PARAMS_LIST.map((pItem, _idx) =>
            <div key={_idx}>
              <div className="gpu_params_item">
                <div className="gpu_params_label">{pItem.title}</div>
                <div className="gpu_params_value">
                  {pItem.key === 'name'
                    ?
                    <Input
                      required
                      className="number_controls"
                      value={state.newModel[pItem.key]} onChange={(e: any) => {
                        setNewModel({
                          ...state.newModel,
                          [pItem.key]: e.target.value
                        });
                      }} />
                    :
                    <InputNumber controls={false}
                      required
                      className="number_controls"
                      value={state.newModel[pItem.key]} onChange={(val: any) => {
                        setNewModel({
                          ...state.newModel,
                          [pItem.key]: val
                        });
                      }} />}
                </div>
              </div>
              {_idx < PARAMS_LIST.length - 1 && <Divider />}
            </div>)}
        </div>
        <div className='add-item-footer'>
          <Button onClick={closeAddModal}>
            CANCEL
          </Button>
          <Button type="primary" onClick={addItemToList}>
            ADD
          </Button>
        </div>
      </Drawer>
    </div >
  );
};

export default ModelSelection;
