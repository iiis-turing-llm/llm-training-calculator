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

1. 确保已安装 Node.js 等环境；

2. 进入/frontend 目录，安装依赖包：

   `yarn install`

3. 确认 Server 地址：

   `在.umirc.ts中配置后端服务地址，默认为本地启动的localhost:8000`

4. 启动本地前端服务：

   `yarn install`

5. 浏览器中访问

   在浏览器中输入`localhost:8080`即可访问（端口如被占用，会自动分配其他端口，在启动日志中可见）
