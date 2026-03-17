import { erc20Abi, parseAbi } from "viem";

export { erc20Abi };

export const vaultAbi = parseAbi([
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function getSharePrice() view returns (uint256)",
  "function getHealthFactor() view returns (uint256)",
  "function getCurrentLeverage() view returns (uint256)",
  "function needsRebalance() view returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function previewDeposit(uint256) view returns (uint256)",
  "function previewWithdraw(uint256) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 shares, uint256 minAmount) returns (uint256 amount)",
]);

export const olympusLendAbi = parseAbi([
  "function assetPrices(address) view returns (uint256)",
  "function getUserAccountData(address) view returns (uint256 totalCollateralBase,uint256 totalDebtBase,uint256 availableBorrowsBase,uint256 currentLiquidationThreshold,uint256 ltv,uint256 healthFactor)",
  "function getCreditLimit(address,address) view returns (uint256)",
  "function getUserDebt(address,address) view returns (uint256)",
  "function getUserCollateral(address,address) view returns (uint256)",
]);

export const aaveAbi = olympusLendAbi;

export const chainlinkAggregatorAbi = parseAbi([
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
]);

export const olympusSwapAbi = parseAbi([
  "function getPoolStateByKey((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)) view returns ((address currency0,address currency1,uint256 reserve0,uint256 reserve1,uint256 totalLiquidity,uint24 baseFee,int24 tickSpacing,address hooks,bool isActive))",
  "function getSwapQuote((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks),bool,uint256) view returns (uint256,uint256)",
  "function swap((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks),bool,int256,uint160) returns (uint256,uint256)",
]);

export const uniswapAbi = olympusSwapAbi;

export const mockTokenAbi = parseAbi([
  "function faucet(uint256) external",
  "function faucetRaw(uint256) external",
  "function canClaimFaucet(address) view returns (bool)",
  "function getFaucetCooldown(address) view returns (uint256)",
]);

export const dataFeedsCacheAbi = parseAbi([
  "function latestRoundData(bytes32 dataId) view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
]);
