// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// library ECDSA{
//     /**
//      * @dev 通过ECDSA，验证签名地址是否正确，如果正确则返回true
//      * _msgHash为消息的hash
//      * _signature为签名
//      * _signer为签名地址
//      */
//     function verify(bytes32 _msgHash, bytes memory _signature, address _signer) internal pure returns (bool) {
//         return recoverSigner(_msgHash, _signature) == _signer;
//     }

//     // @dev 从_msgHash和签名_signature中恢复signer地址
//     function recoverSigner(bytes32 _msgHash, bytes memory _signature) internal pure returns (address){
//         // 检查签名长度，65是标准r,s,v签名的长度
//         require(_signature.length == 65, "invalid signature length");
//         bytes32 r;
//         bytes32 s;
//         uint8 v;
//         // 目前只能用assembly (内联汇编)来从签名中获得r,s,v的值
//         assembly {
//             /*
//             前32 bytes存储签名的长度 (动态数组存储规则)
//             add(sig, 32) = sig的指针 + 32
//             等效为略过signature的前32 bytes
//             mload(p) 载入从内存地址p起始的接下来32 bytes数据
//             */
//             // 读取长度数据后的32 bytes
//             r := mload(add(_signature, 0x20))
//             // 读取之后的32 bytes
//             s := mload(add(_signature, 0x40))
//             // 读取最后一个byte
//             v := byte(0, mload(add(_signature, 0x60)))
//         }
//         // 使用ecrecover(全局函数)：利用 msgHash 和 r,s,v 恢复 signer 地址
//         return ecrecover(_msgHash, v, r, s);
//     }
    
//     /**
//      * @dev 返回 以太坊签名消息
//      * `hash`：消息哈希 
//      * 遵从以太坊签名标准：https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
//      * 以及`EIP191`:https://eips.ethereum.org/EIPS/eip-191`
//      * 添加"\x19Ethereum Signed Message:\n32"字段，防止签名的是可执行交易。
//      */
//     function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
//         // 32 is the length in bytes of hash,
//         // enforced by the type signature above
//         return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
//     }
// }

abstract contract Ownable {
    address internal _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor() {
        address msgSender = msg.sender;
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "!owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "new is 0");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

contract OracleContract is Ownable{
    //using ECDSA for bytes32;
    
    event ComputationRequested(bytes32 indexed requestId, bytes ast, uint256[] numbers);

    event ComputationCompleted(bytes32 indexed requestId, uint256 result);
    
    mapping(bytes32 => uint256) public computeResults;

    event LogicRegistered(uint256 indexed logicId, address indexed owner, bytes ast);

    event Deposited(address indexed user, uint256 amount);

    event Withdrawn(address indexed user, uint256 amount);


    struct Logic {
        bytes ast;
        address owner;
    }

    mapping(uint256 => Logic) public logicRegistry;

    uint256 public logicCounter;

    mapping(address => uint256) public balances;

    uint256 public oracleBalance;


    constructor() {
        _owner = tx.origin;
    }

    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        balances[msg.sender] += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {

        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;

        payable(msg.sender).transfer(amount);

        emit Withdrawn(msg.sender, amount);
    }

     function registerLogic(bytes memory ast) public returns (uint256) {

        logicCounter++;

        logicRegistry[logicCounter] = Logic(ast, msg.sender);

        emit LogicRegistered(logicCounter, msg.sender, ast);

        return logicCounter;
    }

    function compute(uint256 logicId,uint256[] memory numbers) external  payable {

        require(logicRegistry[logicId].owner != address(0), "Logic not found");


        require(msg.value == 0.01 ether, "Insufficient ETH sent");

        (bool success, ) = _owner.call{value: 0.01 ether}("");

        require(success, "Failed to send Ether");

        bytes32 requestId = getRequestId(logicId, numbers);

        emit ComputationRequested(requestId, logicRegistry[logicId].ast, numbers);
    }

  
    function getRequestId(uint256 logicId, uint256[] memory numbers) public pure returns (bytes32) {

        return keccak256(abi.encodePacked(logicId, numbers));
    }


    function getResult(bytes32 requestId)external view returns(uint256){

        uint256 result=computeResults[requestId];

        return result;
    }

    function callback(bytes32 requestId, uint256 result) external onlyOwner{
    
        computeResults[requestId] = result;

        emit ComputationCompleted(requestId, result);
    }

    function callbackBySigner(bytes32 requestId, uint256 result,bytes memory signature) external onlyOwner{
    
        computeResults[requestId] = result;

        bytes32 hash = keccak256(abi.encodePacked(requestId, address(this)));

        bytes32 _ethSignedMessageHash = toEthSignedMessageHash(hash);

        address signer = recoverSigner(_ethSignedMessageHash, signature);

        require(balances[signer] >= 0.01 ether, "Insufficient balance for computation");

        balances[signer] -= 0.01 ether;

        oracleBalance += 0.01 ether;


        emit ComputationCompleted(requestId, result);
    }
   
     function withdrawOracleBalance() external onlyOwner {

        uint256 amount = oracleBalance;

        oracleBalance = 0;

        payable(_owner).transfer(amount);
    }


    /**
     * @dev 通过ECDSA，验证签名地址是否正确，如果正确则返回true
     * _msgHash为消息的hash
     * _signature为签名
     * _signer为签名地址
     */
    function verify(bytes32 _msgHash, bytes memory _signature, address _signer) internal pure returns (bool) {
        return recoverSigner(_msgHash, _signature) == _signer;
    }

    // @dev 从_msgHash和签名_signature中恢复signer地址
    function recoverSigner(bytes32 _msgHash, bytes memory _signature) internal pure returns (address){
        // 检查签名长度，65是标准r,s,v签名的长度
        require(_signature.length == 65, "invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        // 目前只能用assembly (内联汇编)来从签名中获得r,s,v的值
        assembly {
            /*
            前32 bytes存储签名的长度 (动态数组存储规则)
            add(sig, 32) = sig的指针 + 32
            等效为略过signature的前32 bytes
            mload(p) 载入从内存地址p起始的接下来32 bytes数据
            */
            // 读取长度数据后的32 bytes
            r := mload(add(_signature, 0x20))
            // 读取之后的32 bytes
            s := mload(add(_signature, 0x40))
            // 读取最后一个byte
            v := byte(0, mload(add(_signature, 0x60)))
        }
        // 使用ecrecover(全局函数)：利用 msgHash 和 r,s,v 恢复 signer 地址
        return ecrecover(_msgHash, v, r, s);
    }
    
    /**
     * @dev 返回 以太坊签名消息
     * `hash`：消息哈希 
     * 遵从以太坊签名标准：https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
     * 以及`EIP191`:https://eips.ethereum.org/EIPS/eip-191`
     * 添加"\x19Ethereum Signed Message:\n32"字段，防止签名的是可执行交易。
     */
    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    
}