import dayjs from "dayjs";

const LogModel = ({ set, get }: any = {}) => ({
  changeLog: {
    field: '',
    new_value: '',
    pre_value: ''
  },
  history_results: [] as any[],
  autoCalculated: false,
  setAutoCalculated: () => {
    set((state: any) => {
      state.autoCalculated = true
      return state
    });
  },
  setChangeLog: (field: string, new_value?: any, pre_value?: any) => {
    // set((state: any) => {
    //   state.changeLog = {
    //     field,
    //     new_value,
    //     pre_value
    //   }
    //   return state
    // });
  },
  setHistory: (newHistory: any) => {
    set((state: any) => {
      state.history_results = newHistory
      return state
    });
  },
  pushHistory: (type: string, result: any, title?: string) => {
    set((state: any) => {
      state.history_results = [...state.history_results, {
        type,
        result,
        title,
        ts: dayjs(new Date()).format('HH:mm:ss')
      }]
      return state
    });
  }
});

export default LogModel;
