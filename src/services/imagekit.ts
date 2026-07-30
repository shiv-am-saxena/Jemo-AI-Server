import ImageKit from '@imagekit/nodejs';
import logger from './logger';

const client = new ImageKit({
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // This is the default and can be omitted
    baseURL: process.env.IMAGEKIT_BASE_URL,
    logLevel: 'debug',
    logger: logger.child({ name: 'ImageKit' })
});

export default client;
