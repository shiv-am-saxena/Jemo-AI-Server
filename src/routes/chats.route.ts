import { Router } from 'express';
import { isLoggedIn } from '../middlewares/isLoggedIn';
import { chatSharing, deleteChat, fileUpload, getChatList, getMessages, newChat } from '../controllers/chat';

import { uploadFiles } from '../middlewares/upload';

const chatsRouter = Router();

chatsRouter.get('/', isLoggedIn, getChatList);
chatsRouter.get('/:chatId/messages', isLoggedIn, getMessages);
chatsRouter.get('/:chatId/share', isLoggedIn, chatSharing);
chatsRouter.delete('/:chatId', isLoggedIn, deleteChat);
chatsRouter.post('/upload', isLoggedIn, uploadFiles, fileUpload);
chatsRouter.post('/new', isLoggedIn, newChat);
export default chatsRouter;
