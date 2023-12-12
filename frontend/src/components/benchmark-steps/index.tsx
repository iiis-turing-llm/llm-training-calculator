import AiIcon from '../ai-icons'
import { repo_url } from '@/utils/constant'
import styles from './index.less'
import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation();
  return <div className={styles.steps}>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-progress' />
        <div className={styles.step_title_text}>
          {t('step1')}
          <div className={styles.step_desc_text}>
            {t('benchmark step1')} <a href={repo_url} target='_blank'>{t('link')}</a>.
          </div>
        </div>
      </div >
      <div className={styles.step_desc_1}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-upload' />
        <div className={styles.step_title_text}>
          {t('step2')}
          <div className={styles.step_desc_text}>
            {t('benchmark step2')}
          </div>
        </div>
      </div >
      <div className={styles.step_desc_1}></div>
    </div>
    <div className={styles.step_item}>
      <div className={styles.step_title}>
        <AiIcon type='llm-checktimeline' />
        <div className={styles.step_title_text}>
          {t('step3')}
          <div className={styles.step_desc_text}>
            {t('benchmark step1')}
          </div>
        </div>
      </div >
    </div>
  </div>
} 