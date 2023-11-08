import AiIcon from '../ai-icons'
import { Divider } from 'antd'
import styles from './index.less'

export default () => {
  return <div className={styles.steps}>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-excel' />
        <div className={styles.step_title_text}>
          Step1.
          <div className={styles.step_desc_text}>
            Download and run our benchmark program at  Name-Here-Link.
          </div>
        </div>
      </div >
      <div className={styles.step_desc_1}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-edit' />
        <div className={styles.step_title_text}>
          Step2.
          <div className={styles.step_desc_text}>
            Collect and upload the tracing file 「benchmark.csv」to the calculator.
          </div>
        </div>
      </div >
      <div className={styles.step_desc_1}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-upload' />
        <div className={styles.step_title_text}>
          Step3.
          <div className={styles.step_desc_text}>
            Check the real timeline of a specific iteration in the benchmark training process.
          </div>
        </div>
      </div >
    </div>
  </div>
} 