import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import myabi from './artifacts/contracts/Oracle.sol/OracleContract.json'


const ComputeDemo = () => {
  const [numbers, setNumbers] = useState([1]);
  const [ast, setAST] = useState({
    type: 'operation',
    value: '+',
    left: {
      type: 'operation',
      value: '-',
      left: {
        type: 'variable',
        index: 0,
      },
      right: {
        type: 'number',
        value: 1,
      },
    },
    right: {
      type: 'number',
      value: 2,
    },
  });
  const [astInput, setASTInput] = useState(JSON.stringify(ast, null, 2));
  const [logicInput, setLogicInput] = useState(JSON.stringify(ast, null, 2));
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [logicId, setLogicId] = useState(null);
  const [signature, setSignature] = useState('');
  const [hash, setHash] = useState('');

  const CONTRACT_ADDRESS = '0x5aa543e827fbdbab61bfc5405353df3b9a67a8a1'; // Replace with your contract address
  const MyContractABI = myabi.abi; // Replace with your contract ABi
  const connectWalletAndGetContract = useCallback(async () => {
    if (!window.ethereum) {
      console.error("MetaMask not found");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner();
      const newContract = new ethers.Contract(CONTRACT_ADDRESS, MyContractABI, signer);
      setContract(newContract);
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
    }
  }, [CONTRACT_ADDRESS, MyContractABI]);

  useEffect(() => {
    connectWalletAndGetContract();
  }, [connectWalletAndGetContract]);

  const handleCompute = async () => {
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }

    try {
      // Parse and validate AST input
    //   const parsedAST = JSON.parse(astInput);
    //   setAST(parsedAST); // Update the state with the valid AST

    //   // Encode the AST as a bytes array
    //   const astBytes = ethers.toUtf8Bytes(JSON.stringify(parsedAST));

    //   console.log("astBytes",astBytes)
    //const logicIdUint256 = ethers.BigNumber.from(logicId);

      // Call the compute function
      const computeResult = await contract.compute(logicId, numbers, {
        value: ethers.parseEther('0.01'), // 发送 0.01 ETH 作为交易费用
      });
      setError(null);
    } catch (error) {
      console.error('Error computing expression:', error);
      setError('Invalid AST format or computation error. Please check your input.');
    }
  };

  const generateRequestId = async (logicId, numbers) => {
    if (!contract) {
      console.error("Contract not initialized");
      return null;
    }
    const requestId = await contract.getRequestId(logicId, numbers);
    return requestId;
  };

  const handleQuery = async () => {
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }
    try {
      const requestId = await generateRequestId(logicId, numbers);
      console.log("requestId", requestId);
      if (requestId) {
        const result = await contract.getResult(requestId);
        setQueryResult(result.toString());
        setError(null);
      }
    } catch (error) {
      console.error('Error querying result:', error);
      setError('Error querying result. Please check the requestId.');
    }
  };

  const handleRegisterLogic = async () => {
    if (!contract) {
      console.error("合约未初始化");
      return;
    }
    
    try {
      const parsedLogic = JSON.parse(logicInput);
      const logicBytes = ethers.toUtf8Bytes(JSON.stringify(parsedLogic));
      
      const tx = await contract.registerLogic(logicBytes);
      const receipt = await tx.wait();
      
      console.log("receipt",receipt.logs[0].topics[1])
      
      const logicId = parseInt(receipt.logs[0].topics[1], 16);

      setLogicId(logicId.toString());
      setError(null);
    } catch (error) {
      console.error('注册逻辑时出错:', error);
      setError('逻辑注册错误。请检查您的输入。');
    }
  };

  const handleSign = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner();
    const requestId = await generateRequestId(logicId, numbers);
    const logic = await contract.logicRegistry(logicId);
    // 处理获取到的逻辑数据
    const astBytes = logic.ast;

    try {
        const msgHash=ethers.solidityPackedKeccak256(
            ["bytes32", "address"],
            [requestId,CONTRACT_ADDRESS]
        )
       //签名
    const messageHashBytes=ethers.getBytes(msgHash)

    const signature=await signer.signMessage(messageHashBytes)

    console.log(`签名：${signature}`)
      setSignature(signature);
      setHash(msgHash);
      setError(null);
    } catch (error) {
      console.error('Error signing message:', error);
      setError('Error signing message.');
    }

    try {
        const response = await fetch('http://localhost:3010/callbackBySigner', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requestId, signature,astBytes,numbers }),
        });

        if (!response.ok) {
            throw new Error('Failed to call API');
        }

        const responseData = await response.json();
        console.log('Response from server:', responseData);
        return responseData; // 可能需要处理返回的数据
    } catch (error) {
        console.error('Error calling backend API:', error.message);
        throw error; // 可能需要进一步处理错误
    }
  };
  

  return (
    <div>
      {/* <h1>Compute Expression</h1> */}
      <div>
      <h2>注册逻辑</h2>
      <div>
        <label>请输入你需要注册的计算逻辑:</label>
        <textarea
          value={logicInput}
          onChange={(e) => setLogicInput(e.target.value)}
        />
      </div>
      <button onClick={handleRegisterLogic}>点击注册</button>
      <br></br>
      <br></br>
      {logicId !== null && <div>计算逻辑ID: {logicId}</div>}
      <h2>请输入number和逻辑ID进行计算（输入number时 每个数字用空格间隔）</h2>
        <label>Numbers:</label>
        <input
          type="text"
          value={numbers.join(' ')}
          onChange={(e) => {
            const inputValues = e.target.value.split(' ').map(Number).filter(n => !isNaN(n));
            setNumbers(inputValues);
          }}
        />
      </div>
      {/* <div>
        <label>AST:</label>
        <textarea
          value={astInput}
          onChange={(e) => setASTInput(e.target.value)}
        />
      </div> */}

      <div>
        <label>计算逻辑ID:</label>
        <input
          type="number"
          value={logicId}
          onChange={(e) => setLogicId(parseInt(e.target.value))}
        />
      </div>
      <button onClick={handleCompute}>点击计算</button>

      <h2>通过链下签名计算（若进行链下签名，则需要保证充值余额大于0.1个eth）</h2>
      <label>Numbers:</label>
        <input
          type="text"
          value={numbers.join(' ')}
          onChange={(e) => {
            const inputValues = e.target.value.split(' ').map(Number).filter(n => !isNaN(n));
            setNumbers(inputValues);
          }}
        />

<div>
        <label>计算逻辑ID:</label>
        <input
          type="number"
          value={logicId}
          onChange={(e) => setLogicId(parseInt(e.target.value))}
        />
      </div>
      
      <button onClick={handleSign}>点击进行链下签名，并请求计算</button>
      {signature && <div>Signature: {signature}</div>}

      <h2>获取链下计算结果</h2>
      <button onClick={handleQuery}>点击获取结果</button>
      {queryResult !== null && <div>计算结果: {queryResult}</div>}

     

      

      {error && <div style={{ color: 'red' }}>{error}</div>}
    
    </div>
  );
};

export default ComputeDemo;