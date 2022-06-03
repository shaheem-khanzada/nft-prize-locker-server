import { BigNumber } from 'ethers';
import { Transfer } from 'src/schemas/transfer.schema';

export const normalizeAcquire = (result: any) => {
  const { transactionHash, returnValues } = result;
  const { videoId, seller, buyer, amount } = returnValues;
  const payload: Transfer = {
    from: seller.toLowerCase(),
    to: buyer.toLowerCase(),
    tokenId: videoId.toString(),
    amount: amount.toString(),
    transactionHash,
    timestamp: Date.now(),
    actionType: 'Sale',
  };
  return payload;
};

export const normalizeMint = (result: any) => {
  const { transactionHash, returnValues } = result;
  const { videoId, minter, amount } = returnValues;
  const payload: Transfer = {
    from: '0x0000000000000000000000000000000000000000'.toLowerCase(),
    to: minter.toLowerCase(),
    tokenId: videoId.toString(),
    amount: amount.toString(),
    transactionHash,
    timestamp: Date.now(),
    actionType: 'Mint',
  };
  return payload;
};

export const normalizeSponsor = (result: any) => {
  const { transactionHash, returnValues } = result;
  const { videoId, sponsor, amount } = returnValues;
  const payload: Transfer = {
    from: '0x0000000000000000000000000000000000000000'.toLowerCase(),
    to: sponsor.toLowerCase(),
    tokenId: videoId.toString(),
    amount: amount.toString(),
    transactionHash,
    timestamp: Date.now(),
    actionType: 'Sponsor',
  };
  return payload;
};

export const normalizeTransfer = async (result: any, contract: any) => {
  const { transactionHash, returnValues } = result;
  const { from, to, tokenId } = returnValues;
  const nftDetails = await contract.methods.detailsByTokenId(tokenId).call();
  const payload: Transfer = {
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    tokenId: nftDetails.details.videoId,
    amount: '0',
    transactionHash,
    timestamp: Date.now(),
    actionType: 'Transfer',
  };
  return payload;
};

export const normalizeTransferStatus = (result: any) => {
  const { returnValues } = result;
  const { videoId, status, price } = returnValues;
  return { videoId, transferable: status, price };
};

export const normalizeClaimOwnership = (result: any) => {
    const { returnValues } = result;
    const { videoId, owner } = returnValues;
    return { videoId, owner: owner.toLowerCase() };
};

export const normalizeCommentStatusChange = (result: any) => {
  const { returnValues } = result;
  const { status, timestamp, videoId, operator } = returnValues;
  return { operator: operator.toLowerCase(), videoId, commentsActive: status, timestamp: parseInt(timestamp) * 1000 };
};

export const isZeroAddress = (result: any) => {
  const { returnValues } = result;
  const { from } = returnValues;
  return BigNumber.from(from).isZero();
};
