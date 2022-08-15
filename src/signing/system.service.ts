import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import { BigNumber, ContractInterface, ethers } from 'ethers';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  HTTPS_INFURA_URL,
  CONTRACT_ADDRESS,
  TOKEN_ADDRESS,
  WALLET_PRIVATE_KEY,
} from 'src/constant';
import { socialNftAbi } from 'src/contracts/abi';
import { SigningService } from './signing.service';
import normalizeVideoData from 'src/helper/normalizeVideoData';

const tokenAbi = [
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
];

const approveAmount =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

@Injectable()
export class SystemBuyService {
  private readonly logger = new Logger(SystemBuyService.name);
  constructor(
    private configService: ConfigService,
    private signingService: SigningService,
  ) {}

  initilizeNftContract() {
    const provider = new ethers.providers.JsonRpcProvider(
      this.configService.get(HTTPS_INFURA_URL),
    );
    const privateKey = this.configService.get(WALLET_PRIVATE_KEY);
    const contractAddress = this.configService.get(CONTRACT_ADDRESS);
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
      contractAddress,
      socialNftAbi as ContractInterface,
      signer,
    );

    return [contract, signer];
  }

  initilizeTokenContract() {
    const provider = new ethers.providers.JsonRpcProvider(
      this.configService.get(HTTPS_INFURA_URL),
    );
    const privateKey = this.configService.get(WALLET_PRIVATE_KEY);
    const contractAddress = this.configService.get(TOKEN_ADDRESS);
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
      contractAddress,
      tokenAbi as ContractInterface,
      signer,
    );

    return [contract, signer];
  }

  @Cron(CronExpression.EVERY_WEEK)
  handleCron() {
    this.logger.debug('Called after every 7 hour');
    this.systemBuy();
  }

  approveSystemSpending = async () => {
    try {
      const [contract, signer] = this.initilizeTokenContract();
      const nftContract = this.configService.get(CONTRACT_ADDRESS);
      const account = await signer.getAddress();
      const payload = [account, nftContract];
      const allowance: BigNumber = await (contract as ethers.Contract).allowance(
        ...payload,
      );
      if (allowance.lt(BigNumber.from(1000))) {
        await (contract as ethers.Contract).callStatic.approve(
          nftContract,
          approveAmount,
        );
        const tx = await (contract as ethers.Contract).approve(
          nftContract,
          approveAmount,
        );
        const receipt = await tx.wait();
        console.log('receipt', receipt);
        return receipt;
      }
    } catch (error) {
      console.log('approveSystemSpending', error);
    }
  };

  signMessage = async (tokenId: any, price: any, account: any) => {
    const web3 = new Web3();
    const hash = web3.utils.soliditySha3(
      { t: 'uint256', v: tokenId },
      { t: 'uint256', v: price },
      {
        t: 'address',
        v: account,
      },
    );
    const privateKey = this.configService.get(WALLET_PRIVATE_KEY);
    const result = web3.eth.accounts.sign(hash, privateKey);
    return result;
  };

  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async systemBuy() {
    console.log('running system buy');
    try {
      await this.approveSystemSpending();
      const [contractInstance, signer] = this.initilizeNftContract();
      // tokensId = all tokenId of NFT with transferable status true, itemsOnSale = counter if items on sale.
      let {
        tokensId,
        itemsOnSale,
      } = await (contractInstance as ethers.Contract).getNftsOnSale();

      console.log(`${itemsOnSale.toString()} Items on sale:`);

      // Get current date (in epoch time).
      let now = Date.now() / 1000;

      // Map through NFTs on sale to check if they approve for system buy.
      tokensId.map(async (el: any) => {
        // videoId = youtube video Id, transferTimestamp = time when NFT was put on sale (in epoch time).
        let {
          videoId,
          transferTimestamp,
        } = await (contractInstance as ethers.Contract).NFTdetails(el);

        // Get youtube video views.
        const { data: video } = await this.signingService.getVideoById(videoId, true);

        const views = video.viewCount;

        // Calculate time on market.
        let timeOnMarket = now - transferTimestamp;
        // One week on seconds.
        let oneWeek = 604100;

        // Check if video approve for system buy, CHANGE IF STATEMENT twelveHours TO oneWeek ON LAUNCH.
        if (views > 1000 && timeOnMarket > oneWeek) {
          // Price calcultion.
          const regularPrice = Number(views) * 0.001;
          // @ts-ignore
          const reducedPrice: any = (regularPrice / 100).toFixed(3) * 100;

          // Final price parced for the smart contract.
          let price = ethers.utils.parseUnits(reducedPrice.toString());

          // System account address.
          let account = await signer.getAddress();

          // Hash and signature to send the transaction.
          const { messageHash, signature } = await this.signMessage(
            el,
            price,
            account,
          );

          console.log('signature', signature);

          try {
            // Send transaction, systemAcquire function.
            let tx = await (contractInstance as ethers.Contract).systemAcquire(
              el,
              price,
              messageHash,
              signature,
              { gasPrice: 300000000000, gasLimit: 9999999 }
            );

            // Waiting for the receipt.
            let receipt = await tx.wait();

            await this.sleep(60000);

            console.log(
              `Bought tokenId ${el.toString()}, tx hash: ${
                receipt.transactionHash
              }`,
            );
          } catch (error) {
            console.log(
              `${error.reason}: ${error.code}, tx hash: ${error.transactionHash}`,
            );
          }
        } else {
          console.log(
            `tokenId: ${el.toString()}, put on sale ${timeOnMarket} seconds ago but don't have enough views (${views})`,
          );
        }
      });
    } catch (error) {
      console.log('Error:', error);
    }
  }
}
