#该项目展示了一个基于 React 的前端与以太坊智能合约（Oracle）的交互。

#目录结构
1.网关服务代码：GetWay文件夹
2.前端+合约代码：react—dapp

#完成功能：
1.Oracle合约设计与实现
实现一个计算方法(根据需要设计输入参数)，允许任何用户调用，接受用户的执行逻辑和输入，每次调用收取0.01ETH的费用。
实现一个只有所有者可以调用的回调 方法(根据需要设计输入参数)，将执行结果写回合约。
2.网关服务设计和实现
设计和实现网关服务:
监听来自用户的链上请求。
调用计算服务的/compute方法获取执行结果。
使用回调方法将结果写回Oracle合约。
3.基于上述实现，将计算逻辑与用户输入分离。允许用户通过合约方法预定义/注册计算逻辑，并在Oracle调用时指定执行逻辑的ID，以减少gas消耗。考虑如何将计算逻辑存储在合约中，并相应地更新Oracle、Gateway Service 和 Client 项目
4.基于以上实现，允许用户通过签名的方式在链下调用 Oracle。一种可行的逻辑是:允许用户预存ETH，在 Oracle 执行完成后，提交结果时从用户存款中划走0.01 ETH 到可提现余额中。设计验证逻辑，防止恶意 Gateway 在没有合法请求的情况下拿走用户预存的 ETH。

#功能总结：以上4个任务均完成，并且设计对应简单客户端页面 页面展示如下:
<img width="624" alt="image" src="https://github.com/tjgljs/Eng-R1-phone-17340332001/assets/110324972/bf42d09f-4a77-41ff-bc74-159059baf2d8">


## 如何部署项目

### 本地先部署项目提供的compute API服务 
http://localhost:3000/compute

### 启动Getway目录下的getway.js
启动命令 node getway.js [注：在文件中替换合约部署者的私钥]
依赖安装：npm install 

### 切换到react-dapp 

依赖安装：npm install 

###编译Oracle.sol合约 npx hardhat compile

###部署Oracle.sol合约 npx hardhat run scripts/deploy_Oracle.js --network bnbtest  [在hardhat.config中替换自己的钱包私钥]

###启动前端页面 npm start 

#操作流程：
#1.填写自己的逻辑公式，并注册，注册成功后生成对应逻辑公式的ID
#2.填写numbers数组，注意每个元素应使用空格间隔开
#3.可以使用两种方式进行链下运算
#方法一：直接填写对应的numbers值和你想要的逻辑公式的ID值，点击计算按钮，进行完成钱包交互，链下预言机服务回调数据写入合约结束后，点击获取结果可以查看运算结果（每次计算需消耗0.1个eth）
#方法二：直接填写对应的numbers值和你想要的逻辑公式的ID值，点击签名计算按钮，完成钱包交互签名，预言机自动回调函数写入运算结果到合约结束后，点击获取结果可以查看运算结果(需要提前充值eth到合约，每次计算结果写入合约时自动扣除0.01eth)








