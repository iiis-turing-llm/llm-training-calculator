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
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

const GlobalPanel = (props: any) => {
  const { totalConfig, setProject } = useModel(ProjectModel);

  const onChangeItem = (key: string, val: number) => {
    if (val < 0) {
      return
    }
    setProject({
      totalConfig: {
        ...totalConfig,
        [key]: val
      }
    })
  }

  return (
    <div className={styles.nest}>
      <p className={styles.section_title}>
        Total number of tokens
      </p>
      <div className={styles.section_content}>
        <InputNumber
          style={{ width: '100%' }}
          value={totalConfig.number_of_input_tokens}
          prefix="M"
          // formatter={(value) => `${value}M`}
          onChange={(val) => {
            onChangeItem('number_of_input_tokens', val)
          }}
          addonBefore={< MinusOutlined onClick={() => {
            onChangeItem('number_of_input_tokens', (totalConfig.data_parallel_degree || 0) - 1)
          }} />}
          addonAfter={<div>
            {/* <span style={{ padding: '0 10px', color: '#666' }}>M</span> */}
            <PlusOutlined onClick={() => {
              onChangeItem('number_of_input_tokens', (totalConfig.data_parallel_degree || 0) + 1)
            }} /></div>}
          controls={false}
          step={1}
          min={1}
        />
      </div>
      <p className={styles.section_title}>
        Data parallel degree
      </p>
      <div className={styles.section_content}>
        <InputNumber
          style={{ width: '100%' }}
          value={totalConfig.data_parallel_degree}
          onChange={(val) => {
            onChangeItem('data_parallel_degree', val)
          }}
          addonBefore={< MinusOutlined onClick={() => {
            onChangeItem('data_parallel_degree', (totalConfig.number_of_input_tokens || 0) - 1)
          }} />}
          addonAfter={<PlusOutlined onClick={() => {
            onChangeItem('data_parallel_degree', (totalConfig.number_of_input_tokens || 0) + 1)
          }} />}
          controls={false}
          step={1}
          min={1}
        />
      </div>
      <p className={styles.section_title}>
        Number of epochs
      </p>
      <div className={styles.section_content}>
        <InputNumber
          style={{ width: '100%' }}
          value={totalConfig.epochs}
          onChange={(val) => {
            onChangeItem('epochs', val)
          }}
          addonBefore={< MinusOutlined onClick={() => {
            onChangeItem('epochs', (totalConfig.epochs || 0) + 1)
          }} />}
          addonAfter={<PlusOutlined onClick={() => {
            onChangeItem('epochs', (totalConfig.epochs || 0) + 1)
          }} />}
          controls={false}
          step={1}
          min={1}
        />
      </div>
    </div>
  );
};

export default GlobalPanel;
