import AiIcon from '../ai-icons'
import { Divider } from 'antd'
import { useTranslation } from 'react-i18next';
import styles from './index.less'

export default () => {
  const { t } = useTranslation();
  return <div className={styles.steps}>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-excel' />
        <div className={styles.step_title_text}>
          {t('step1')}
          <div className={styles.step_desc_text}>
            {t('custom step1')}
          </div>
        </div>
      </div >
      <div className={styles.step_desc}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-edit' />
        <div className={styles.step_title_text}>
          {t('step2')}
          <div className={styles.step_desc_text}>
            {t('custom step2')}
          </div>
        </div>
      </div >
      <div className={styles.step_desc}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-function' />
        <div className={styles.step_title_text}>
          {t('step3')}
          <div className={styles.step_desc_text}>
            {t('custom step3')}
          </div>
        </div>
      </div >
      <div className={styles.step_desc_1}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-upload' />
        <div className={styles.step_title_text}>
          {t('step4')}
          <div className={styles.step_desc_text}>
            {t('custom step4')}
          </div>
        </div>
      </div >
    </div>
  </div>
} 