const ethers = require('ethers');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 合约ABI和地址
const contractABI = [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "requestId",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "result",
                "type": "uint256"
            }
        ],
        "name": "callback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "requestId",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "result",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "callbackBySigner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "logicId",
                "type": "uint256"
            },
            {
                "internalType": "uint256[]",
                "name": "numbers",
                "type": "uint256[]"
            }
        ],
        "name": "compute",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "requestId",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "result",
                "type": "uint256"
            }
        ],
        "name": "ComputationCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "requestId",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "ast",
                "type": "bytes"
            },
            {
                "indexed": false,
                "internalType": "uint256[]",
                "name": "numbers",
                "type": "uint256[]"
            }
        ],
        "name": "ComputationRequested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Deposited",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "logicId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "ast",
                "type": "bytes"
            }
        ],
        "name": "LogicRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "bytes",
                "name": "ast",
                "type": "bytes"
            }
        ],
        "name": "registerLogic",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Withdrawn",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "withdrawOracleBalance",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "balances",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "computeResults",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "logicId",
                "type": "uint256"
            },
            {
                "internalType": "uint256[]",
                "name": "numbers",
                "type": "uint256[]"
            }
        ],
        "name": "getRequestId",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "requestId",
                "type": "bytes32"
            }
        ],
        "name": "getResult",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "logicCounter",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "logicRegistry",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "ast",
                "type": "bytes"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "oracleBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]; // 替换为实际的合约ABI
const contractAddress = '0x5aa543e827fbdbab61bfc5405353df3b9a67a8a1'; // 替换为实际的合约地址





// 您的以太坊节点 URL
const providerUrl = 'https://bsc-testnet-rpc.publicnode.com';

// 合约所有者的私钥
const ownerPrivateKey = '5335af82ac2487520bc454887ad8fa9553650b182c9ad4194672819cd0068057'; // 替换为实际的私钥

const provider=new ethers.JsonRpcProvider(providerUrl)

const signer=new ethers.Wallet(ownerPrivateKey,provider)

const contract = new ethers.Contract(contractAddress, contractABI, provider);

const app = express();

app.use(bodyParser.json());
app.use(cors());


// 监听智能合约事件
const listenContractEvents = () => {
    console.log("持续监听.......")

    contract.on('ComputationRequested',async (requestId, ast, numbers) => {

    console.log('Computation requested:', { requestId, ast, numbers });

    const numbersString = numbers.map(Number);
    console.log("1111",numbersString)
  

    // 解码 ast 参数
    const astData = ethers.toUtf8String(ast);

    console.log('AST data:', JSON.parse(astData));
        
        try {
            const requestDate = {ast: JSON.parse(astData),numbers: numbersString}
            console.log("requestdate",requestDate)
       
        const result = await axios.post('http://localhost:3000/compute', requestDate);

        console.log("222",result)
        // 使用所有者的私钥调用合约的 callback 函数
        
        const tx = await contract.connect(signer).callback(requestId, result.data.result);

        await tx.wait();
    
        console.log('Computation result updated:', { requestId, result: result.data.result });

        } catch (error) {

        console.error('Error processing computation:', error);
        }
    });
    }

// 启动监听事件
listenContractEvents();



// 后端接口，接收签名并调用智能合约

app.post('/callbackBySigner', async (req, res) => {
try {
    const { requestId, signature, astBytes, numbers } = req.body;

    const numbersString = numbers.map(Number);

    // 记录接收到的数据
    console.log("Received request body:", req.body);
    console.log("Received astBytes:", astBytes);

    const astData = ethers.toUtf8String(astBytes);

    // 验证并解析输入数据
    let parsedAstData;
    try {
        parsedAstData = JSON.parse(astData);
    } catch (parseError) {
        throw new Error('Invalid JSON in astBytes: ' + parseError.message);
    }

    const requestDate = { ast: parsedAstData, numbers: numbersString };
    console.log("Parsed request data:", requestDate);

    // 请求计算结果
    const result = await axios.post('http://localhost:3000/compute', requestDate);
    console.log("Received compute result:", result.data);

    // 使用所有者的私钥调用合约的 callbackBySigner 函数
    console.log("result.data.result",result.data.result)
    const tx = await contract.connect(signer).callbackBySigner(requestId, result.data.result, signature);
    await tx.wait();

    console.log("hash",tx);

    res.json({ success: true, transactionHash: tx.hash });
} catch (error) {
    console.error('Error in /callbackBySigner:', error);
    res.status(500).json({ success: false, error: error.message });
}
});

app.listen(3010, () => {
console.log('Server running on port 3010');
});