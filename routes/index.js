var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  if(req.session.token){
    return res.redirect('/users/manage')
  }else{
    res.render('index');
  }
});

//reset password routes
router.get('/forgot',function(req,res,next){
  var token = req.session.token
  if(token){
    return res.redirect('/users/manage')
  }
  res.render('recovery')
})

module.exports = router;
