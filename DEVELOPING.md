## 先决条件

1.  本地系统需要安装Node 8或Node 8以上版本，如果需要使用多个版本的Node，则可以考虑使用[nvm](https://github.com/creationix/nvm)

2.  本项目默认使用[MongoDB](https://docs.mongodb.com/guides/server/install/)数据源，可在官网查看相关文档进行安装
2.  本项目需要安装 [yarn](https://yarnpkg.com/) 来管理node依赖包，请使用 `npm install --global yarn` 进行全局安装
3.  本项目需要安装 [typescript](https://www.typescriptlang.org/)，请使用命令 `yarn global add typescript ts-node` 进行全局安装
4.  本项目需要安装 [mocha](https://github.com/mochajs/mocha) 运行测试程序，请使用命令 `yarn global add mocha` 进行全局安装

## 步骤

克隆项目到本地后只需要执行一次。

1. 克隆项目到本地
    ```
        git clone https://github.com/steedos/steedos-platform 
    ```
2. 进入项目中  
    ```
        cd steedos-platform
    ```
3. 配置代理服务器

```
export http_proxy=http://192.168.0.88:7890
export https_proxy=http://192.168.0.88:7890
git config --global https.proxy http://192.168.0.88:7890
git config --global https.proxy http://192.168.0.88:7890
yarn config registry https://registry.npm.taobao.org
```

4. 在当前的Lerna存储库中引导软件包并安装所有依赖包。
    ```
        yarn bootstrap
    ```
5. 安装项目所依赖的node软件包
    ```
        yarn
    ```
6. 在文本编辑器（例如：VS Code、Sublime Text）中打开项目

## 运行项目
以运行合同项目为例：


1. 在文本编辑器中打开steedos-platform，进入apps/contracts
    ```
        cd steedos-platform/apps/contracts
    ```
2. .env是当前合同项目的配置文件，需拷贝一份到本地，与.env在同一路径，并重命名为.env.local，作为本地配置文件
    ```
        cp .env .env.local
    ```

3. 编辑.env.local文件，配置数据源和项目使用的端口，其他个性化配置请参考[帮助](https://www.steedos.com/developer/)

4. 在合同项目下执行yarn build编译该项目所需依赖包
    ```
        yarn build
    ```

5. 执行yarn start运行项目n
    ```
        yarn start
    ```
6. 打开浏览器（推荐chrome、360安全浏览器极速模式），输入root_url地址（.env.local中配置）访问合同项目

## 常用命令

### `yarn compile`

将typescript编译为javascript

### `yarn clean`

这将清除所有生成的文件和目录

运行 `yarn cleal-all` 将会清除node_modules文件目录
