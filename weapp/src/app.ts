import { Component } from 'react'
import Taro from '@tarojs/taro'
import './app.css'

class App extends Component {
  componentDidMount() {
    console.log('🚀 Mall WeApp started')
    // 初始化全局配置
    this.initGlobalConfig()
  }

  initGlobalConfig() {
    const apiBaseUrl = 'http://localhost:8080/api'
    Taro.setStorageSync('API_BASE_URL', apiBaseUrl)
  }

  render() {
    return this.props.children
  }
}

export default App
