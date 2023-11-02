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
            Download our excel template.
          </div>
        </div>
      </div >
      <div className={styles.step_desc}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-edit' />
        <div className={styles.step_title_text}>
          Step2.
          <div className={styles.step_desc_text}>
            Fill in necessary input.
          </div>
        </div>
      </div >
      <div className={styles.step_desc}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-function' />
        <div className={styles.step_title_text}>
          Step3.
          <div className={styles.step_desc_text}>
            Customize intermediate computation formulas.
          </div>
        </div>
      </div >
      <div className={styles.step_desc_1}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-upload' />
        <div className={styles.step_title_text}>
          Step4.
          <div className={styles.step_desc_text}>
            Upload your template file with required computation results in [Output] Sheet.
          </div>
        </div>
      </div >
    </div>
  </div>
} 