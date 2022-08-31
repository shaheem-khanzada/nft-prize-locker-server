import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from 'ethers/lib/utils';
import { Server } from 'socket.io';
import { Historical } from 'src/schemas/historical.schema';
import { Transfer } from 'src/schemas/transfer.schema';

@WebSocketGateway({ cors: { origin: '*' }, transports: ['websocket'] })
export class EventsGateway
  implements OnGatewayInit {
  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('NFT-Prize-Locker');

  afterInit() {
    this.logger.info('Events Initilized');
  }

  @OnEvent('log.created')
  handleLogCreated(payload: Transfer) {
    this.server.emit(`watch-${payload.tokenId}-logs`, payload);
  }

  @OnEvent('comment.created')
  handleCommentCreated(newComment: Historical) {
    this.server.emit(`comment-${newComment.tokenId}-created`, newComment);
  }

  @OnEvent('comment.deleted')
  handleCommentDeleted(deletedComment: Historical) {
    this.server.emit(`comment-${deletedComment.tokenId}-deleted`, deletedComment);
  }
  
  @OnEvent('comment.updated')
  handleCommentUpdated(updatedComment: Historical) {
    this.server.emit(`comment-${updatedComment.tokenId}-updated`, updatedComment);
  }

  @OnEvent('transfer.status.change')
  handleTransferStatusChanges(payload: { commentsActive: boolean, videoId: string, price: string }) {
    this.server.emit(`transfer-${payload.videoId}-status`, payload);
  }

  @OnEvent('claim.owner.ship')
  handleClaimOwnership(payload: { owner: string, videoId: string }) {
    this.server.emit(`claim-${payload.videoId}-nft`, payload);
  }

  @OnEvent('comment.status.change')
  handleCommentStatusChange(payload: any) {
    this.server.emit(`comment-status-changed-${payload.videoId}`, payload);
  }

  @OnEvent('videoUpdated')
  handleVideoViewsChange(payload: any) {
    this.server.emit(`video-views-changed-${payload.videoId}`, payload);
  }
}
