# 基础知识

## 1. 什么是 SVC

SVC 是 Singing Voice Conversion（歌声转换）的缩写。Voice Conversion 是语音转换，Voice Conversion 可以保留声音的内容但改变声音的音色。而 Singing Voice Conversion 就是 Voice Conversion 的一种，Voice Conversion 能做到的 Singing Voice Conversion 都能做到，还能转换歌声。

## 2. SVC 有哪些项目

常见的开源的 SVC 项目有 So-VITS-SVC，RVC，DDSP-SVC，Diffusion-SVC，Diff-SVC，ReFlow-VAE-SVC

本 fusion 整合包集成了 So-VITS4.1，DDSP6.0，ReFlow-VAE-SVC 三个项目（后续可能加入 RVC）

## 3. 关于这些 SVC 项目

### 3.1 So-VITS-SVC

So-VITS-SVC 的长老级整合包：作者 [bilibili@羽毛布団](https://space.bilibili.com/3493141443250876/)

作为迄今为止模型质量上限最高的 SVC 算法，sovits 早在其早期版本便已显露头角，在早期的 AI 音乐中，sovits 凭借其强大的算法受到人们关注。在缝合更新了扩散模型后，其抑制电音的能力也一度让 AI 音频能以假乱真。

在 23 年 3 月 10 日因为不可抗拒的原因，原作者删库了，现在 github 上的仓库是爱好者重建的并且也处于 Archieve 状态，最后一次大更新停留在了今年 4 月，基本不可能复活了。

本整合包的 so-vits 已由幻灵等大佬重构，大幅优化速度

:::tip
请不要将 So-VITS-SVC 简称为 SVC，正确的简称应该是 sov
:::

:::warning
So-VITS-SVC5.0 并不是新版 sovits，sovits 在 4.1 后再也没有更新了，这个 5.0 是个碰瓷抄袭的项目，并且多次攻击其他 SVC 开发者，甚至开盒了很多开发者。请不要使用
:::

### 3.2 DDSP-SVC 6.0

作者：[bilibili@yxlllc](https://www.yuque.com/yuqueyonghux2gzt8/ek7xd3/br0b1g2thqm7h5pz)

项目开源仓库: [yxlllc/ddsp-svc](https://github.com/yxlllc/DDSP-SVC)

有着超快的训练速度和理论最低的训练配置需求（甚至可以 CPU 炼），需求较低的数据时长，能用的实时变声。

作为 SVC 中更新最快的算法，ddsp 从 3.0 时期的勉强能用，到 4.0 时期作为 sovits 的下位替代，再到 6.0 时期的能在一些数据集中与 sovits 抗衡（别问为什么没有 ddsp5，因为某人懒得改 5.0 的 bug 直接更新到了 6.0）

目前已集成进 fusion 整合包，原 ddsp6.0 整合包 (指我自己那个) 不再维护。

### 3.3 ReFlow-VAE-SVC

作者：[bilibili@yxlllc](https://www.yuque.com/yuqueyonghux2gzt8/ek7xd3/br0b1g2thqm7h5pz)

项目开源仓库: [yxlllc/reflow-vae-svc](https://github.com/yxlllc/reflow-vae-svc)

作为最新的 SVC 算法，ReFlow 拥有极高的训练效率和学习能力，对于数据集的长度要求较低，拥有全新的点对点推理模式，其质量有望超过 sovits。相对的，其训练拟合更快，容易炸炉（恼）

目前还在测试阶段，欢迎大家试用并反馈试用体验。
