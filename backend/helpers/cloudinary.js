import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadBuffer = (buffer, opts = {}) =>
    new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: 'nexo-adjuntos', resource_type: 'auto', ...opts },
            (err, result) => (err ? reject(err) : resolve(result))
        ).end(buffer)
    })

export const deleteAsset = (publicId, resourceType = 'raw') =>
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
