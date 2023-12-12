import { Empty } from 'antd'
import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation();
  return <Empty
    image="./images/no-data.png"
    imageStyle={{ height: 100 }}
    description={
      <span>
        {t('nodata')}
      </span>
    }
  >
  </Empty>
} 