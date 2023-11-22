import {
  InputNumber,
} from 'antd';
import useModel from 'flooks';
import styles from './index.less';
import ProjectModel from '@/models/projectModel';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import LogModel from '@/models/logModel';

const GlobalPanel = (props: any) => {
  const { totalConfig, setProject } = useModel(ProjectModel);
  const { setChangeLog } = useModel(LogModel);
  const onChangeItem = (key: string, val: number, title?: string) => {
    if (val < 0) {
      return
    }
    setChangeLog(title, val, totalConfig?.[key])
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
            onChangeItem('number_of_input_tokens', val, 'Total number of tokens')
          }}
          addonBefore={< MinusOutlined onClick={(e) => {
            onChangeItem('number_of_input_tokens', (totalConfig.number_of_input_tokens || 0) - 1, 'Total number of tokens')
            e.stopPropagation()
          }} />}
          addonAfter={<div>
            {/* <span style={{ padding: '0 10px', color: '#666' }}>M</span> */}
            <PlusOutlined onClick={(e) => {
              onChangeItem('number_of_input_tokens', (totalConfig.number_of_input_tokens || 0) + 1, 'Total number of tokens')
              e.stopPropagation()
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
            onChangeItem('data_parallel_degree', val, 'Data parallel degree')
          }}
          addonBefore={< MinusOutlined onClick={(e) => {
            onChangeItem('data_parallel_degree', (totalConfig.data_parallel_degree || 0) - 1, 'Data parallel degree')
            e.stopPropagation()
          }} />}
          addonAfter={<PlusOutlined onClick={(e) => {
            onChangeItem('data_parallel_degree', (totalConfig.data_parallel_degree || 0) + 1, 'Data parallel degree')
            e.stopPropagation()
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
            onChangeItem('epochs', val, ' Number of epochs')
          }}
          addonBefore={< MinusOutlined onClick={(e) => {
            onChangeItem('epochs', (totalConfig.epochs || 0) - 1, 'Number of epochs')
            e.stopPropagation()
          }} />}
          addonAfter={<PlusOutlined onClick={(e) => {
            onChangeItem('epochs', (totalConfig.epochs || 0) + 1, 'Number of epochs')
            e.stopPropagation()
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
