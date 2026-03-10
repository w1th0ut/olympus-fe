import { erc20Abi, parseAbi } from "viem";

export { erc20Abi };

export const vaultAbi = parseAbi([
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function getSharePrice() view returns (uint256)",
  "function getHealthFactor() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function previewDeposit(uint256) view returns (uint256)",
]);

export const aaveAbi = parseAbi([
  "function assetPrices(address) view returns (uint256)",
  "function getUserAccountData(address) view returns (uint256 totalCollateralBase,uint256 totalDebtBase,uint256 availableBorrowsBase,uint256 currentLiquidationThreshold,uint256 ltv,uint256 healthFactor)",
  "function getCreditLimit(address,address) view returns (uint256)",
  "function getUserDebt(address,address) view returns (uint256)",
  "function getUserCollateral(address,address) view returns (uint256)",
]);

export const sourceRouterAbi = parseAbi([
  "function supportedChains(uint64) view returns (bool)",
  "function supportedAssets(address) view returns (bool)",
  "function getBridgeFee(uint64,address,uint256,uint256,address) view returns (uint256)",
  "function bridgeToArbitrum(address,uint256,uint64,address,uint256,address) payable returns (bytes32)",
  "event CrossChainBridgeInitiated(bytes32 indexed messageId, uint64 indexed destinationChain, address indexed sender, address asset, uint256 amount, address receiver, address targetBaseAsset, uint256 minShares)",
]);

export const ccipReceiverAbi = parseAbi([
  "function executeZap(bytes32 messageId, uint256 minShares) external",
  "function pendingDeposits(bytes32) view returns (bytes32 messageId, uint64 sourceChainSelector, address sourceSender, address receiver, uint256 amount, address sourceAsset, address targetBaseAsset, uint256 minShares, bool executed)",
  "event DepositStored(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address indexed receiver, uint256 amount)",
  "event ZapExecuted(bytes32 indexed messageId, address indexed vault, uint256 shares)",
  "event ZapFailed(bytes32 indexed messageId, string reason)",
  "event CrossChainDepositReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address indexed receiver, address asset, uint256 amount, uint256 shares)",
  "event CrossChainDepositFailed(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address indexed receiver, address asset, uint256 amount, string reason)",
]);

export const uniswapAbi = parseAbi([
  "function getPoolStateByKey((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)) view returns ((address currency0,address currency1,uint256 reserve0,uint256 reserve1,uint256 totalLiquidity,uint24 baseFee,int24 tickSpacing,address hooks,bool isActive))",
  "function getSwapQuote((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks),bool,uint256) view returns (uint256,uint256)",
  "function swap((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks),bool,int256,uint160) returns (uint256,uint256)",
]);
