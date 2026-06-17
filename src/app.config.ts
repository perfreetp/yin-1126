export default defineAppConfig({
  pages: [
    'pages/dashboard/index',
    'pages/bills/index',
    'pages/split/index',
    'pages/todos/index',
    'pages/receipt/index',
    'pages/bill-detail/index',
    'pages/bill-scan/index',
    'pages/payees/index',
    'pages/split-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '票据管家',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1677FF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/dashboard/index',
        text: '看板'
      },
      {
        pagePath: 'pages/bills/index',
        text: '票据'
      },
      {
        pagePath: 'pages/split/index',
        text: '拆分'
      },
      {
        pagePath: 'pages/todos/index',
        text: '待办'
      },
      {
        pagePath: 'pages/receipt/index',
        text: '签收'
      }
    ]
  }
})
