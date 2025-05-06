const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = 'VOVH6sdmpNWjRRIqCc8rdxs01lwHzfr3';
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
    try {

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return encrypted.toString('hex');
    }catch (e){
        console.log(e, "error");
    }

    // return {
    //     iv: iv.toString('hex'),
    //     content: encrypted.toString('hex')
    // };
};

const decrypt = (hash) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrpyted.toString();
};

module.exports = {
    encrypt,
    decrypt
};