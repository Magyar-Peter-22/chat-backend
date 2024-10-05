import { v2 as cloudinary } from 'cloudinary';

//setup the cloud
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function createSignature(options) {
    //timestamp of the signature
    const timestamp = Math.round((new Date).getTime() / 1000);

    //request signature from cloudinary
    const signature = cloudinary.utils.api_sign_request({
        timestamp: timestamp,
        ...options
    }, process.env.CLOUDINARY_API_SECRET);

    return {
        signature,
        timestamp,
        ...options
    };
}

//create siganture for a chat media
async function createChatSignature(roomId, messageId, imageId,type) {
    console.log(type);
    const options = {
        upload_preset: uploadPresets[type],
        public_id: imageId,
        folder: `/chat-app/${roomId}/${messageId}`,
    }

    const signature = await createSignature(options);

    return signature;
}

const uploadPresets={
    "image":"message_image",
    "video":"message_video",
    "raw":"message_raw"
}

export { createChatSignature };
