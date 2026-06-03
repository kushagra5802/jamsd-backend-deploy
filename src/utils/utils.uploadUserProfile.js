const multer = require("multer")
const path = require("path");
const fs = require("fs");

// Define the maximum size for uploading
// picture i.e. 1 MB. it is optional
const maxSize = 5 * 1000 * 1000;

const upload = multer({
    //storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {

        // Set the filetypes, it is optional

        const filetypes = /jpg|png|jpeg/;

        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) { 
            // upload only jpg, png, jpeg  format
            return cb(new Error("Error: File upload only supports the "
            + "following filetypes - " + filetypes))
          }

        return cb(null, true);
    }

    // reportLink is the name of file attribute
}).single("profileImageLink");


module.exports = upload;