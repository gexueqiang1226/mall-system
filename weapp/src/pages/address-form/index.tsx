import { Component } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface AddressFormState {
  id: string
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
  loading: boolean
}

export default class AddressForm extends Component<{}, AddressFormState> {
  constructor(props) {
    super(props)
    this.state = { id: '', receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false, loading: false }
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const addrId = currentPage.options?.id
    if (addrId) this.loadAddress(+addrId)
  }

  loadAddress = async (id: number) => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    try {
      const res = await api.get('/addresses', { userId: userInfo.userId })
      const addresses = res.data || []
      const addr = addresses.find((a: any) => a.id === id)
      if (addr) {
        this.setState({
          id: String(addr.id), receiver: addr.receiver || '', phone: addr.phone || '',
          province: addr.province || '', city: addr.city || '', district: addr.district || '',
          detail: addr.detail || '', isDefault: !!addr.isDefault,
        })
      }
    } catch {}
  }

  save = async () => {
    const { id, receiver, phone, province, city, district, detail, isDefault } = this.state
    if (!receiver || !phone || !detail) { Taro.showToast({ title: '请填写完整信息', icon: 'error' }); return }
    const userInfo = Taro.getStorageSync('USER_INFO')
    const body = { userId: userInfo.userId, receiver, phone, province, city, district, detail, isDefault }
    this.setState({ loading: true })
    try {
      if (id) { await api.put(`/addresses/${id}`, body) }
      else { await api.post('/addresses', body) }
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch { Taro.showToast({ title: '保存失败', icon: 'error' }) }
    this.setState({ loading: false })
  }

  goBack = () => Taro.navigateBack()

  render() {
    const { id, receiver, phone, province, city, district, detail, isDefault, loading } = this.state
    return (
      <View className="addr-form-page">
        <View className="af-header">
          <View className="af-back" onClick={this.goBack}><Text>‹</Text></View>
          <Text className="af-title">{id ? '编辑地址' : '新增地址'}</Text>
          <View style={{ width: '32px' }} />
        </View>
        <View className="af-body">
          <View className="af-field"><Text className="af-label">收件人</Text><Input className="af-input" placeholder="请输入收件人" value={receiver} onInput={(e) => this.setState({ receiver: e.detail.value })} /></View>
          <View className="af-field"><Text className="af-label">手机号</Text><Input className="af-input" placeholder="请输入手机号" type="number" value={phone} onInput={(e) => this.setState({ phone: e.detail.value })} /></View>
          <View className="af-field"><Text className="af-label">省份</Text><Input className="af-input" placeholder="省" value={province} onInput={(e) => this.setState({ province: e.detail.value })} /></View>
          <View className="af-field"><Text className="af-label">城市</Text><Input className="af-input" placeholder="市" value={city} onInput={(e) => this.setState({ city: e.detail.value })} /></View>
          <View className="af-field"><Text className="af-label">区县</Text><Input className="af-input" placeholder="区/县" value={district} onInput={(e) => this.setState({ district: e.detail.value })} /></View>
          <View className="af-field"><Text className="af-label">详细地址</Text><Input className="af-input" placeholder="请输入详细地址" value={detail} onInput={(e) => this.setState({ detail: e.detail.value })} /></View>
          <View className="af-default-row" onClick={() => this.setState({ isDefault: !isDefault })}>
            <View className={`check-circle ${isDefault ? 'checked' : ''}`} />
            <Text className="af-default-text">设为默认地址</Text>
          </View>
          <View className={`af-submit ${loading ? 'disabled' : ''}`} onClick={loading ? undefined : this.save}>
            <Text className="af-submit-text">保存</Text>
          </View>
        </View>
      </View>
    )
  }
}
