#!/bin/bash
# Taro H5 post-build: 注入旧版CSS + Taro覆盖样式到index.html
# 用法: cd weapp && bash post-build.sh

set -e
DIST_DIR="$(dirname "$0")/dist"
OLD_CSS="/tmp/sams-mall-css.css"
INDEX_HTML="$DIST_DIR/index.html"

if [ ! -f "$OLD_CSS" ]; then
  echo "❌ 旧版CSS不存在: $OLD_CSS"
  echo "   先运行: python3 -c \"css=open('weapp/dist/sams-mall.html').read(); ...\""
  exit 1
fi

if [ ! -f "$INDEX_HTML" ]; then
  echo "❌ index.html不存在，请先 build"
  exit 1
fi

# 用Python注入
python3 << 'PYEOF'
import re, sys

old_css_path = '/tmp/sams-mall-css.css'
index_path = '/mnt/c/develop/serverproj/mall-system/weapp/dist/index.html'

extra_css = '''
/* === Taro 强制覆盖（!important） === */
html { background: #F5F5F5 !important; }
body {
  max-width: 430px !important; margin: 0 auto !important;
  background: #F5F5F5 !important;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif !important;
}
#app, .taro-tabbar__container, .taro-tabbar__panel {
  max-width: 430px !important; margin: 0 auto !important;
  position: relative !important; background: #F5F5F5 !important;
}
.taro-tabbar__panel { padding-bottom: 50px !important; }
.taro_page { background: #F5F5F5 !important; max-width: 430px !important; }
.taro-tabbar__tabbar.taro-tabbar__tabbar-bottom {
  max-width: 430px !important; position: fixed !important; bottom: 0 !important;
  left: 0 !important; right: 0 !important; margin: 0 auto !important;
  width: 100% !important; border-top: 1px solid #eee !important;
  background: white !important; z-index: 100 !important; height: 50px !important;
  display: flex !important; align-items: center !important;
}
.weui-tabbar { background: white !important; height: 50px !important; }
.weui-tabbar__item { padding: 4px 0 !important; text-decoration: none !important;
  flex: 1 !important; display: flex !important; flex-direction: column !important;
  align-items: center !important; gap: 2px !important; }
.weui-tabbar__label { font-size: 10px !important; color: #999999 !important; }
.weui-tabbar__item.weui-bar__item_on .weui-tabbar__label { color: #0056B3 !important; font-weight: bold !important; }
.banner-section { border-radius: 12px !important; overflow: hidden !important; margin: 12px !important; height: 150px !important; }
taro-view-core { display: block; }
taro-text-core { display: inline; }
taro-image-core { display: block; overflow: hidden; }
taro-scroll-view-core { display: block; }
.recommend-img img, .seckill-card-img img, .new-arrival-img img {
  width: 100% !important; height: 100% !important; object-fit: cover !important;
}
'''

old_css = open(old_css_path).read()
html = open(index_path).read()

# 移除之前的注入
html = re.sub(r'<style>\s*/\*.*?旧版.*?</style>', '', html, flags=re.DOTALL)
html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)

# 注入
style_tag = f'<style>\n{extra_css}\n/* === 旧版完整样式 === */\n{old_css}\n</style>'
html = html.replace('</head>', style_tag + '</head>')

open(index_path, 'w').write(html)
print(f'✅ CSS注入完成: extra={len(extra_css)} + old={len(old_css)} bytes')
PYEOF
