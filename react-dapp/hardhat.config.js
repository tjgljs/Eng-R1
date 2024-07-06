require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  paths: {
    //编译后生成json的路径
      artifacts: './src/artifacts',
    },
    networks: {
      bnbtest: {
        url: `https://bsc-testnet-rpc.publicnode.com`,
        accounts: ["5335af82ac2487520bc454887ad8fa9553650b182c9ad4194672819cd0068057"],
      },
    },
};
