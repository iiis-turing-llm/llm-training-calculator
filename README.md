# **llm training calculator**

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

`window.service_base_url = "http://localhost:8001"`

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
