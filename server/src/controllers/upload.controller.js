import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Upload image to Cloudinary
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided"
            });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'chat-images',
            resource_type: 'auto',
            transformation: [
                { width: 1024, height: 1024, crop: 'limit' }
            ]
        });

        // Delete the temporary file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id
            }
        });
    } catch (error) {
        console.error("Error uploading image:", error);

        // Clean up temporary file if it exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error("Error deleting temporary file:", unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: "Failed to upload image"
        });
    }
};

// Delete image from Cloudinary
export const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: "Public ID is required"
            });
        }

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId);

        res.status(200).json({
            success: true,
            message: "Image deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete image"
        });
    }
};
