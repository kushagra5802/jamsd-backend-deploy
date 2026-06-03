const { roles } = require('./roles');
 
exports.grantAccess = function(action, resource) {
 return async (req, res, next) => {
    console.log('grantaccess called', req.authData);
    console.log('Resource: ', resource);
  try {
   const permission = roles.can(req.authData.role)[action](resource);
   if (!permission.granted) {
    return res.status(401).json({
     error: "You don't have enough permission to perform this action"
    });
   }
   next()
  } catch (error) {
   next(error)
  }
 }
}