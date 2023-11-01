const ProjectModel = ({ set, get }: any = {}) => ({
  curMode: 'guide', // 当前模式， 默认Guide
  curGpu: null as any, // 当前选择的GPU
  curModel: null as any, // 当前选择的Model
  modelMetrics: null as any, // Model Metrics，根据所选择的model和minibatch size计算而来
  otherConfig: {
    optimization_strategy: 'No recomputation'
  } as any, // 其他配置
  recommendConfig: {},
  result: null as any, // 计算结果
  showError: false, //  是否显示错误提示
  errorMsg: '', // 错误信息
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
});

export default ProjectModel;
