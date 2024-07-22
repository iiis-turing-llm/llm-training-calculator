const ProjectModel = ({ set, get }: any = {}) => ({
  curMode: 'guide', // 当前模式， 默认Guide
  curGpu: null as any, // 当前选择的GPU
  curModel: null as any, // 当前选择的Model
  modelMetrics: null as any, // Model Metrics，根据所选择的model和minibatch size计算而来
  otherConfig: {
    optimization_strategy: 'No recomputation'
  } as any, // 其他配置
  totalConfig: {
    // data_parallel_degree: 0,
    // number_of_input_tokens: 0,
    // epochs: 0
  } as any,
  recommendConfig: {},
  result: null as any, // 计算结果
  latest_result: null as any, //上一次计算结果
  bm_result: null as any, // benchmark 解析结果
  curIteration: 0, // 当前指针
  autoRecalc: false,
  loading: false,
  showError: false, //  是否显示错误提示
  errorMsg: '', // 错误信息
  changeLog: {
    field: '',
    new_value: '',
    pre_value: ''
  },
  checkSize: () => {
    const { curModel, otherConfig } = get();
    if (!curModel) {
      return false
    }
    if (curModel.minibatch_size % otherConfig.microbatch_size > 0) {
      return false
    }
    return true
  },
  checkPipeline: () => {
    const { curModel, otherConfig } = get();
    if (!curModel) {
      return false
    }
    if (curModel.num_layers % otherConfig.pipeline_parallel_degree > 0) {
      return false
    }
    return true
  },
  checkTotalConfig: () => {
    const { totalConfig, curMode } = get();
    const { data_parallel_degree, number_of_input_tokens, epochs } = totalConfig || {}
    if (data_parallel_degree && number_of_input_tokens && epochs) {
      return true
    }
    //新的表单检查需要在mode等于inference的时候不检查策略和轮次
    if (curMode == 'inference' && data_parallel_degree && number_of_input_tokens) {
      return true
    }
    return false
  },
  setProject: (pro: any) => {
    set((state: any) => {
      return Object.assign(state, pro);
    });
  },
  setOtherConfig: (params: any) => {
    set((state: any) => {
      state.otherConfig = {
        ...state.otherConfig,
        ...params
      }
      return state
    });
  },
  setChangeLog: (field: string, new_value?: any, pre_value?: any) => {
    set((state: any) => {
      state.changeLog = {
        field,
        new_value,
        pre_value
      }
      return state
    });
  },
  setRecommendConfig: (key: string, val: any) => {
    set((state: any) => {
      state.recommendConfig[key] = val
      return state
    });
  },
  clearFields: () => {
    set((state: any) => {
      state.curGpu = null;
      state.curModel = null;
      state.otherConfig = { optimization_strategy: 'No recomputation' };
      state.totalConfig = {};
      return state;
    });
  }
});

export default ProjectModel;
