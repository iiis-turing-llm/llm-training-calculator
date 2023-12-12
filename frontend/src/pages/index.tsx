import React, { FC, useEffect, useRef } from 'react';
import { Layout, Divider, Tabs, Button, Drawer, Switch } from 'antd'
const { Header, Sider, Content } = Layout
import PanelLeft from '@/components/panel-left';
import PanelRight from '@/components/panel-right';
import { HistoryOutlined } from '@ant-design/icons';
import { useImmer } from 'use-immer';
import useModel from 'flooks';
import ProjectModel from '@/models/projectModel';
import History from './history';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
// import '@/i8n/config';
import './index.less'

export interface IIndexProps { }
const Index: FC<IIndexProps> = (props) => {
  const { t } = useTranslation();
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
  const handleLanChange = (checked: boolean) => {
    i18n.changeLanguage(checked ? 'cn' : 'en')
  }
  const items = [
    {
      key: 'guide',
      label: t('guide mode')
    },
    {
      key: 'custom',
      label: t('custom mode')
    },
    {
      key: 'benchmark',
      label: t('benchmark mode')
    }
  ];

  return (
    <React.Fragment>
      <Layout className="llm-layout-wrapper">
        <Header>
          <div className="header-wrapper">
            <div className={`${i18n.language === 'cn' ? 'header-logo1' : 'header-logo'}`}>
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
                {t('comparision')}
              </Button>
            </div>
            <div className="header-language">
              <Switch checkedChildren="中文" unCheckedChildren="English" onChange={handleLanChange}></Switch>
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
      <Drawer title={t('comparision')} placement="right" width={900}
        onClose={() => { (historyRef?.current as any)?.handleClose() }}
        open={state.showHistory}>
        <History onClose={() => { setState({ showHistory: false }) }} ref={historyRef} />
      </Drawer>
    </React.Fragment>
  );
};

export default Index;
