const multer = require("multer")
const path = require("path");
const fs = require("fs");
const DateFormatter = require("../utils/utils.dateFormatter");
let filePath = "uploads/images/" + DateFormatter.getMonth(new Date());
const jsonStorage = multer.memoryStorage(); // Store the uploaded file in memory

fs.access(filePath, (error) => {
    if (error) {
        fs.mkdir(filePath, (error) => {
            if (error) {
                console.log(error);
            }
        });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filePath)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + ".jpg")
    }
})

// Define the maximum size for uploading
// picture i.e. 1 MB. it is optional
const maxSize = 50 * 1000 * 1000;

const upload = multer({
    //storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {

        // Set the filetypes, it is optional

        const filetypes = /jpg|png|doc|docx|pdf/;

        if (!file.originalname.match(/\.(jpg|png|doc|docx|pdf|doc)$/)) { 
            // upload only jpg, png, doc, docx, pdf format
            return cb(new Error("Error: File upload only supports the "
            + "following filetypes - " + filetypes))
          }

        return cb(null, true);
    }

    // reportLink is the name of file attribute
}).single("reportLink");

const uploadInvoice = multer({
    //storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {

        // Set the filetypes, it is optional

        const filetypes = /jpg|png|doc|docx|pdf/;

        if (!file.originalname.match(/\.(jpg|png|doc|docx|pdf|doc)$/)) { 
            // upload only jpg, png, doc, docx, pdf format
            return cb(new Error("Error: File upload only supports the "
            + "following filetypes - " + filetypes))
          }

        return cb(null, true);
    }

    // reportLink is the name of file attribute
}).single("invoiceDocument");

const imageUpload = multer({
    //storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {

        // Set the filetypes, it is optional

        const filetypes = /jpg|png/;

        if (!file.originalname.match(/\.(jpg|png)$/)) { 
            // upload only jpg, png, doc, docx, pdf format
            return cb(new Error("Error: Image upload only supports the "
            + "following filetypes - " + filetypes))
          }

        return cb(null, true);
    }

    // reportLink is the name of file attribute
}).single("grievanceImages");




// const multipleUpload = multer({ 
//     fileFilter: function (req, file, cb) {
        
//         const filetypes = /jpg|png|jpeg/;

//         if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) { 
//             // upload only jpg, png, jpeg format
//             return cb(new Error("Error: File upload only supports the "
//             + "following filetypes - " + filetypes))
//           }

//         return cb(null, true);
//     }
//  }).array('grievanceImages', 5);

const multipleUpload = multer({
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB
  },
  fileFilter: function (req, file, cb) {
    const allowedExtensions =
      /\.(jpg|jpeg|png|webp|pdf|csv|xls|xlsx|mp4|mov|avi|mkv)$/i;

    const allowedMimeTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",

      // Documents
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      // Videos
      "video/mp4",
      "video/quicktime",   // .mov
      "video/x-msvideo",   // .avi
      "video/x-matroska"   // .mkv
    ];

    const isExtValid = allowedExtensions.test(file.originalname.toLowerCase());
    const isMimeValid = allowedMimeTypes.includes(file.mimetype);

    if (!isExtValid || !isMimeValid) {
      return cb(
        new Error("Unsupported file type")
      );
    }

    cb(null, true);
  }
}).array("media", 10);


//  const chatImageUpload = multer({ 
//     fileFilter: function (req, file, cb) {
        
//         const filetypes = /jpg|png|jpeg/;

//         if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) { 
//             // upload only jpg, png, jpeg format
//             return cb(new Error("Error: File upload only supports the "
//             + "following filetypes - " + filetypes))
//           }

//         return cb(null, true);
//     }
//  }).array('chatImage', 5);

const store = multer.memoryStorage();
const chatImageUpload = multer({
  store,
  limits: {
    fileSize: 100 * 1024 * 1024, // max 100MB per file (you can adjust)
  },
  fileFilter: function (req, file, cb) {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png|gif|webp|pdf|csv|xls|xlsx|mp4|mov|avi|mkv/;
    const extname = file.originalname.toLowerCase().match(/\.(jpeg|jpg|png|gif|webp|pdf|csv|xls|xlsx|mp4|mov|avi|mkv)$/);
    // const mimetype = file.mimetype;

    // if (extname && filetypes.test(extname[1]) && filetypes.test(mimetype.split("/").pop())) {
    //   return cb(null, true);
    // }
    return cb(null, true);

    // cb(
    //   new Error(
    //     "Error: Supported file types are jpeg, jpg, png, gif, webp, pdf, csv, xls, xlsx, mp4, mov, avi, mkv"
    //   )
    // );
  },
}).array("chatImage", 10); 

 const taskImagesUpload = multer({ 
    fileFilter: function (req, file, cb) {
        
        const filetypes = /jpg|png|jpeg/;

        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) { 
            // upload only jpg, png, jpeg format
            return cb(new Error("Error: File upload only supports the "
            + "following filetypes - " + filetypes))
          }

        return cb(null, true);
    }
 }).array('taskImages', 5);

 const uploadJsonFile = multer({ storage: jsonStorage }).single('boundaries', 1);


module.exports = { upload, uploadInvoice, imageUpload, multipleUpload, taskImagesUpload, uploadJsonFile, chatImageUpload };