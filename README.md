# IIIS-Turing LLM Training Calculator

本项目基于主流的大语言模型和GPU型号，对大语言模型分布式训练过程中的并行配置需求进行自动分析，并能够模拟给定配置下大模型训练的时间开销、显存开销、资源使用率等核心指标。本项目旨在进一步促进大模型训练的简化与推广，并为用户自定义模型训练计划提供参考。

计算器用到的估算公式和原理见[技术报告](https://arxiv.org/abs/2304.08177)



## 本项目主要内容：

- 根据给定的训练目标（模型类型、GPU型号、batch size等）推荐相应的并行配置
- 根据给定配置计算分布式训练过程中各步骤的时间开销和显存开销
- 生成可视化时间轴并展示资源利用率

下图是计算器输出使用A100训练LLaMA2-70B的计算结果和可视化界面：

![image](https://github.com/lexsaints/powershell/blob/master/IMG/ps2.png)



## Demo试用

现在可直接访问我们的[线上demo版](https://lx.ainanjing.org.cn:12340/calculator/)



## 源码下载和本地部署

## 一、启动后端服务：

1. 创建项目的虚拟环境：

   `python -m venv .venv`

2. 激活该虚拟环境：

   `source .venv/bin/activate`

3. 安装相关依赖：

   `pip install -r backend/requirements.txt`

4. 运行 main 脚本启动服务(默认 8000 端口，如果端口被占用，在命令后增加参数` --port 端口号`)：

   `python backend/main.py`

## 二、启动前端服务：

a. 如无更改前端代码需求，可直接打开静态页面：

进入/frontend/local 目录，直接（正常双击即可）在浏览器中打开 index.html，即可使用功能。
如后端服务端口非 8000，请编辑 html，在第一个<script>中配置相应的端口，如：

```
window.service_base_url = "http://localhost:8001"
```

b. 如希望以开发模式打开前端服务：

1. 确保已安装 Node.js 等环境；

2. 进入/frontend 目录，安装依赖包(使用 npm 安装和启动也是可以的)：

   `yarn install`

3. 确认 Server 地址：

   `在src/utils/constant.ts中配置后端服务地址，默认为本地启动的localhost:8000`

4. 启动本地前端服务：

   `yarn start`

5. 浏览器中访问

   在浏览器中输入`localhost:8080`即可访问（端口如被占用，会自动分配其他端口，在启动日志中可见）

   

## Quick Start

### Guide mode

- 选择GPU和模型类型
- 决定显存优化技术和minibatch、microbatch大小
- 决定张量并行度
- 调整张量并行度并选择对应的流水线并行度以避免out of memory

根据应用指引填入所需的参数完成并行训练配置，计算器输出最终的时间开销、显存开销并展示时间轴

### Custom mode

- 下载excel模板工具
- 填写相关输入
- 定制计算公式
- 上传带有计算结果的模板文件

LLM training calculator将可视化训练时间轴





## FAQ



## 致谢

