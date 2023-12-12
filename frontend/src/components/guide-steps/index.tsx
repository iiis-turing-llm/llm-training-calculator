import AiIcon from '../ai-icons'
import { Divider } from 'antd'
import { useTranslation } from 'react-i18next';
import styles from './index.less'

export default () => {
  const { t } = useTranslation();
  return <div className={styles.steps}>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-gpu' />
        <div className={styles.step_title_text}>
          {t('cluster')}
        </div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text}>
          {t('step cluster')}
          <div>
            <Divider style={{ marginTop: 20 }} />
          </div>
        </div>
      </div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-model' />
        <div className={styles.step_title_text}>
          {t('models')}
        </div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text}>
          {t('step models')}
          <div>
            <Divider style={{ marginTop: 20 }} />
          </div>
        </div>
      </div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-others' />
        <div className={styles.step_title_text}>
          {t('others')}
        </div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text}>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step1.</div>
            <div>
              {t('step other1')}
            </div>
          </div>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step2.</div>
            <div>
              {t('step other2')}
            </div>
          </div>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step3.</div>
            <div>
              {t('step other3')}
            </div>
          </div>
          <div className={styles.other_item}>
            <div className={styles.other_item_title}>Step4.</div>
            <div>
              {t('step other4')}
            </div>
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
        <div className={styles.step_title_text}>
          {t('input')}
        </div>
      </div >
      <div className={styles.step_desc}>
        <div className={styles.step_desc_text_other}>
          {t('step input')}
        </div>
      </div>
    </div>
  </div>
} 