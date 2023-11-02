import { Empty } from 'antd'
export default () => {
  return <Empty
    image="./images/no-data.png"
    imageStyle={{ height: 100 }}
    description={
      <span>
        No Data
      </span>
    }
  >
  </Empty>
} 