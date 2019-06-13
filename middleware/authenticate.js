const jwt = require('jsonwebtoken'),
      {User} = require('../models/user');
var authenticate_simple = (req, res, next) => {
  var token = req.session.token;
  if(!token){
    return  res.redirect('/');
  }else{
    var decode = []; 
    jwt.verify(token,'private|afsan|key',(err,decoded)=>{
      decode.push(decoded);
    });
    User.findOne({
      '_id': decode[0]._id,
      'tokens.token': token,
      'tokens.access': decode[0].access
    },(err,user)=>{
      if(err){
        res.status(401).send(err);
      }else{
        req.user = user;
        req.token = token;
        next();
      }
    
    });
  }
  
};

module.exports = {authenticate_simple};
