import { Router } from 'express';
import { isLoggedIn } from '../middlewares/isLoggedIn';
import { chatSharing, getChatList, getMessages } from '../controllers/chat';

const chatsRouter = Router();

chatsRouter.get('/', isLoggedIn, getChatList);
chatsRouter.get('/:chatId/messages', isLoggedIn, getMessages);
chatsRouter.get('/:chatId/share', isLoggedIn, chatSharing);

export default chatsRouter;