export const fileFieldValidation = {
    images: [`image/jpeg`, `image/png`, `image/jpg`],
    videos: [`video/mp4`, `video/mkv`, `video/avi`],
}


export const fileFilter = (validation=[]) => { 
    return (req, file, cb) => { 
        if (!validation.includes(file.mimetype)) {
            cb(new Error('Invalid file type',{ cause: { status : 400 } }), false);
        } else {
            cb(null, true);
        }
    }
}
