import { PropsWithChildren } from 'react'
import '@nutui/nutui-taro/dist/style.css'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  return children
}

export default App
