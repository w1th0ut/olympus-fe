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
]);

export const uniswapAbi = parseAbi([
  "function getPoolStateByKey((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)) view returns ((address currency0,address currency1,uint256 reserve0,uint256 reserve1,uint256 totalLiquidity,uint24 baseFee,int24 tickSpacing,address hooks,bool isActive))",
  "function getSwapQuote((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks),bool,uint256) view returns (uint256,uint256)",
  "function swap((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks),bool,int256,uint160) returns (uint256,uint256)",
]);
