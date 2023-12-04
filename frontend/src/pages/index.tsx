import React, { FC, useEffect, useRef } from 'react';
import { Layout, Divider, Tabs, Button, Drawer } from 'antd'
const { Header, Sider, Content } = Layout
import PanelLeft from '@/components/panel-left';
import PanelRight from '@/components/panel-right';
import { HistoryOutlined } from '@ant-design/icons';
import { useImmer } from 'use-immer';
import useModel from 'flooks';
import ProjectModel from '@/models/projectModel';
import History from './history'
import './index.less'

const items = [
  {
    key: 'guide',
    label: 'Guide Mode'
  },
  {
    key: 'custom',
    label: 'Custom Mode'
  },
  {
    key: 'benchmark',
    label: 'Benchmark Mode'
  }
];
export interface IIndexProps { }
const Index: FC<IIndexProps> = (props) => {
  const historyRef = useRef()
  const [state, setState] = useImmer({
    showHistory: false,
  });
  const { setProject, curMode } = useModel(ProjectModel);
  const onChangeMode = (mode: string) => {
    setProject({
      curMode: mode,
      result: null,
      // bm_result: null
    })
  }

  return (
    <React.Fragment>
      <Layout className="llm-layout-wrapper">
        <Header>
          <div className="header-wrapper">
            <div className="header-logo">
              <div></div>
            </div>
            <Divider type="vertical" />
            <div className="header-tabs">
              <Tabs
                items={items}
                activeKey={curMode}
                onChange={onChangeMode}>
              </Tabs>
            </div>
            <div className="header-history">
              <Button type="primary" ghost icon={<HistoryOutlined />}
                onClick={() => { setState({ showHistory: true }) }}>
                COMPARISON
              </Button>
            </div>
          </div>
        </Header>
        <Layout className="llm-inner-layout-wrapper">
          <Sider width={curMode === 'guide' ? 430 : 400} theme='light'>
            <PanelLeft></PanelLeft>
          </Sider>
          <Content>
            <PanelRight></PanelRight>
          </Content>
        </Layout>
      </Layout>
      <Drawer title="COMPARISON" placement="right" width={900}
        onClose={() => { (historyRef?.current as any)?.handleClose() }}
        open={state.showHistory}>
        <History onClose={() => { setState({ showHistory: false }) }} ref={historyRef} />
      </Drawer>
    </React.Fragment>
  );
};

export default Index;
