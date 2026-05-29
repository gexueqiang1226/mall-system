import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getStorage } from '@/utils/storage'
import { View, Text, Input } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface State {
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
  userId: number
  addrId: number
  saving: boolean
}

export default class AddressForm extends Component<{}, State> {
  state: State = {
    receiver: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false,
    userId: 0,
    addrId: 0,
    saving: false,
  }

  componentDidMount() {
    const userInfo = getStorage('USER_INFO')
    const userId = userInfo?.id || getStorage('USER_ID') || 0
    const params = Taro.getCurrentInstance().router?.params || {}
    const addrId = Number(params.id) || 0
    this.setState({ userId, addrId })
    if (addrId) this.loadAddress(addrId)
  }

  async loadAddress(id: number) {
    try {
      const res = await api.get(`/addresses/${id}`)
      const addr = res?.data
      if (addr) {
        this.setState({
          receiver: addr.receiver || '',
          phone: addr.phone || '',
          province: addr.province || '',
          city: addr.city || '',
          district: addr.district || '',
          detail: addr.detail || '',
          isDefault: addr.isDefault || false,
        })
      }
    } catch {}
  }

  async handleSave() {
    const { receiver, phone, province, city, district, detail, isDefault, userId, addrId, saving } = this.state
    if (!receiver.trim()) { Taro.showToast({ title: '请输入收件人', icon: 'none' }); return }
    if (!phone.trim()) { Taro.showToast({ title: '请输入手机号', icon: 'none' }); return }
    if (!province.trim()) { Taro.showToast({ title: '请输入省份', icon: 'none' }); return }
    if (!city.trim()) { Taro.showToast({ title: '请输入城市', icon: 'none' }); return }
    if (!detail.trim()) { Taro.showToast({ title: '请输入详细地址', icon: 'none' }); return }
    if (saving) return
    this.setState({ saving: true })
    const body = { userId, receiver: receiver.trim(), phone: phone.trim(), province: province.trim(), city: city.trim(), district: district.trim(), detail: detail.trim(), isDefault }
    try {
      if (addrId) {
        await api.put(`/addresses/${addrId}`, body)
      } else {
        await api.post('/addresses', body)
      }
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 800)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
      this.setState({ saving: false })
    }
  }

  renderInput(label: string, value: string, key: keyof State, placeholder: string, type?: any) {
    return (
      <View className='form-item'>
        <Text className='form-label'>{label}</Text>
        <Input
          className='form-input'
          placeholder={placeholder}
          value={value}
          type={type || 'text'}
          onInput={e => this.setState({ [key]: e.detail.value } as any)}
        />
      </View>
    )
  }

  render() {
    const { receiver, phone, province, city, district, detail, isDefault, saving, addrId } = this.state

    return (
      <View className='addr-form-page'>
        {/* 表单 */}
        <View className='form-card'>
          {this.renderInput('收件人', receiver, 'receiver', '请输入收件人姓名')}
          {this.renderInput('手机号', phone, 'phone', '请输入手机号', 'number')}
          {this.renderInput('省份', province, 'province', '如：广东省')}
          {this.renderInput('城市', city, 'city', '如：深圳市')}
          {this.renderInput('区/县', district, 'district', '如：南山区')}
          <View className='form-item no-border'>
            <Text className='form-label'>详细地址</Text>
            <Input
              className='form-input'
              placeholder='街道、楼栋、门牌号'
              value={detail}
              onInput={e => this.setState({ detail: e.detail.value })}
            />
          </View>
        </View>

        {/* 设为默认 */}
        <View className='default-row'>
          <Text className='default-label'>设为默认地址</Text>
          <View
            className={`toggle-btn ${isDefault ? 'on' : ''}`}
            onClick={() => this.setState({ isDefault: !isDefault })}
          >
            <View className='toggle-circle' />
          </View>
        </View>

        {/* 保存按钮 */}
        <View
          className={`save-btn ${saving ? 'disabled' : ''}`}
          onClick={this.handleSave.bind(this)}
        >
          <Text>{saving ? '保存中...' : (addrId ? '保存修改' : '新增地址')}</Text>
        </View>
      </View>
    )
  }
}
