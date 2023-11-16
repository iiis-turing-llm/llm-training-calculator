import AiIcon from '../ai-icons'
import { Divider } from 'antd'
import styles from './index.less'

export default () => {
  return <div className={styles.steps}>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-gpu' />
        <div className={styles.step_title_text}>Cluster</div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text}>
          Determine the GPU type and per-host network bandwidth.
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
        <div className={styles.step_desc_text}>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step1.</div>
            <div>
              Determine the optimization strategy.</div>
          </div>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step2.</div>
            <div>
              Determine tensor parallel degree.</div>
          </div>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step3.</div>
            <div>Determine pipeline parallel degree.</div>
          </div>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step4.</div>
            <div>Determine the microbatch size.</div>
          </div>
          <div>
            <Divider style={{ marginTop: 20 }} />
          </div>
        </div>
      </div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-global' />
        <div className={styles.step_title_text}>Input</div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text_other}>
          Input the total number of tokens / data parallel degree / number of epochs.
        </div>
      </div>
    </div>
  </div>
} 