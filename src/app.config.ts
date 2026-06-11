export default defineAppConfig({
  pages: ['pages/index/index'],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'PaletteCard',
    navigationBarTextStyle: 'black',
  },
  permission: {
    'scope.writePhotosAlbum': {
      desc: '用于保存生成的卡片到相册',
    },
  },
})
