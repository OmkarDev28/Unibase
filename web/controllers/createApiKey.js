import crypto from 'crypto';

export const generateApiKey = () => {
    
    const randomHex = crypto.randomBytes(20).toString('hex');
    return `ub_live_${randomHex}`;
};