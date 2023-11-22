const LogModel = ({ set, get }: any = {}) => ({
  changeLog: {
    field: '',
    new_value: '',
    pre_value: ''
  },
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
  }
});

export default LogModel;
