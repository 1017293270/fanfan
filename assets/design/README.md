# 开饭狸设计资产

这个目录保存可用于还原小程序视觉规范的设计参考图和素材板。

## UI 参考图

- `kaifanli-home-reference.html`：首页视觉参考源文件，使用品牌 token 和示例推荐内容。
- `kaifanli-home-reference.png`：从 HTML 渲染导出的首页参考图，用于对照小程序实现。

## Image2 素材

- `kaifanli-brand-kit-sheet.png`：image2 生成的饭饭狸品牌素材板，包含主形象、表情、饭碗和小组件图标概念。
- `kaifanli-icon-contact-sheet.png`：从素材板裁出的图标总览。
- `kaifanli-complete-asset-board.png`：用户确认的新完整品牌素材板，用作 H5 视觉源。
- `kaifanli-image2-uniform-icon-sheet.png`：image2 重新生成的 12 枚统一 256px 动作/食物图标源。
- `kaifanli-image2-nav-icon-sheet.png`：image2 重新生成的 6 枚统一 256px 导航/账号图标源。
- `kaifanli-image2-filter-icon-sheet.png`：image2 重新生成的 4 枚统一 256px 筛选工具图标源。
- `image2-icons/`、`image2-nav-icons/`、`image2-filter-icons/`：从 image2 图标源裁出的单枚 256x256 PNG。
- `mascots/`、`ui/`：从完整素材板裁出的饭饭狸贴纸、徽章和状态素材。
- `icons/`：从素材板裁出的单个图标源文件。

## H5 内使用

H5 运行时素材复制在 `h5/src/assets/`：

- `image2-icons/`：换一批、收藏、不喜欢、附近、导航、预算、辣度、米饭、火锅、面、轻食、甜品。
- `image2-nav-icons/`：开饭、地点、店铺、导入、管理、邀请码。
- `image2-filter-icons/`：时间、钱包、清淡叶子、烧烤。
- `mascots/`：开心、思考、好饿、惊讶、推荐、没想法、捧饭碗、拿定位、加载和空状态。
- `ui/`：应用图标、AI 推荐徽章、匹配徽章、饭饭狸推荐徽章。

新 UI 优先使用 image2 统一图标；只在需要饭饭狸表情/贴纸/状态插画时使用素材板裁切图。

## 小程序内使用

小程序实际使用的图标复制在 `miniprogram/assets/icons/`：

- `paw-refresh.png`：换一批。
- `paw-heart.png`：收藏。
- `paw-dislike.png`：不喜欢。
- `chopsticks-nav.png`：带我去。
- `bowl-sparkle.png`：推荐徽章。
- `bamboo-location.png`：位置相关预留。
- `chili-face.png`：辣度相关预留。

头像源图保存在 `assets/brand/`，小程序内使用副本保存在 `miniprogram/assets/brand/`。

## 视觉约束

- 主色保持番茄红、米白、翠竹绿、暖橙黄、深墨色和浅桃色的组合。
- 饭饭狸用于降低决策压力，不能压过餐厅名称、距离、预算和行动按钮。
- 工具按钮优先使用图标加短文案，避免只有长文字。
- 图标需要保持统一尺寸和圆形软底，避免直接使用带标签文字的素材板裁切。
- 小程序卡片保持清楚的信息层级，不做厚重阴影和大面积单色背景。
