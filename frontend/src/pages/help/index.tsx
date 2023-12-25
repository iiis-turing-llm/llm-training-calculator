import { FC } from 'react'
import styles from './index.less'
import { help_doc_link } from '@/utils/constant'
const Index: FC = (props) => {
  return <div className={styles.container}>
    <iframe src={`${help_doc_link}`}
      sandbox="allow-scripts allow-top-navigation allow-same-origin allow-forms" />
  </div>
}
export default Index