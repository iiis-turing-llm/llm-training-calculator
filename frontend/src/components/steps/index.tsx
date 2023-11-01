import AiIcon from '../ai-icons'
import { Divider } from 'antd'
import styles from './index.less'

export default () => {
  return <div className={styles.steps}>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-gpu' />
        <div className={styles.step_title_text}>GPUs</div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text}>
          Determine the GPU type.
          <div>
            <Divider style={{ marginTop: 20 }} />
          </div>
        </div>
      </div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-model' />
        <div className={styles.step_title_text}>Models</div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text}>
          Determine the model type and input minibatch size.
          <div>
            <Divider style={{ marginTop: 20 }} />
          </div>
        </div>
      </div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-others' />
        <div className={styles.step_title_text}>Others</div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text_other}>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step1.</div>
            <div>Determine the optimization strategy and input the microbatch size.</div>
          </div>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step2.</div>
            <div>Determine Tensor parallel degree/Pipeline parallel degree following recommendation.</div>
          </div>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step3.</div>
            <div>Input Per-host network bandwidth.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
} 