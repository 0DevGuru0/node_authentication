const express               = require('express'),
      cookieParser          = require('cookie-parser'),
      session               = require('express-session'),
      mongodb               = require('mongodb'),
      router                = express.Router(),
      expressValidator      = require('express-validator'),
      bcrypt                = require('bcryptjs'),
      jwt                   = require('jsonwebtoken'),
      {authenticate_simple} = require('../middleware/authenticate'),
      {User}                = require('../models/user'),
      {profileinfo}         = require('../models/profile'),
      multer                = require('multer'),
      Promise               = require('promise'),
      { body }              = require('express-validator/check'),
      {URL}                 = require('url'),
      path                  = require('path'),
      fs                    = require('fs'),
      {imageFilter}         = require('./utils.js'),
      crypto                = require('crypto'),
      async                 = require('async')
      nodemailer            = require('nodemailer'),
      upload                = multer({dest: 'public/images/uploads',fileFilter:imageFilter,limits: { fileSize: 3000000  }}),
      redis                 = require('redis'),
      Url                   = 'redis://127.0.0.1:6379',
      client                = redis.createClient(Url),
      util                  = require('util');
      require('../services/cache.js')
      
      
client.get = util.promisify(client.get)
router.use(cookieParser());
router.use(session({
  secret:'$2b$10$xd3WzHObGLmDvHdR9ZPbXOxorJ0LrEDpmgQUIoWA6uhUaoEp/xV2m',
  saveUninitialized:true,
  resave: true,
  cookie: {expires: new Date(Date.now() + 900000),sameSite: true},
}))
router.use(expressValidator())
// router.use(function(req,res,next){
//   res.locals.success = req.flash('success')
//   next()
// })

//Routes
router.get('/cash',authenticate_simple,async (req,res,nex)=>{
  
  var id = String(req.user._id)
  const cashedBlogs = await client.get(id)
  if(cashedBlogs){
    console.log('SERVING FROM CASHE')
    return res.send(JSON.parse(cashedBlogs))
  }
  const blogs = await User.find({_id:req.user._id});
  console.log('SERVING FROM MONGO DB')
  res.send(blogs);
  client.set(id,JSON.stringify(blogs))
})

router.post('/forgot',function(req,res,nex){  
  async.waterfall([
    
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        console.log('token: ',token)
        done(err, token);
      });
    },
    
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error_msg', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'af.hadafi',
          pass: '0331492838007'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@gmail.com',
        subject: 'Password Reset(Authentication)',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        console.log('email sent')
        done(err, 'done');
      });
    }
  ],function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
   })
});  

router.get('/reset/:token',function(req,res){
  var token = req.session.token
  if(token){
    return res.redirect('/users/manage')
  }
  User.findOne({ 
    resetPasswordToken: req.params.token, 
    resetPasswordExpires: { $gt: Date.now() }
   },function(err, user) {
    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {user});
  });
})

router.post('/reset/:token', function(req, res) {
  async.waterfall([

    function(done) {
      User.findOne({ 
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: { $gt: Date.now() } 
      },function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        var salt = bcrypt.genSaltSync(10);
        password = bcrypt.hashSync(req.body.password, salt);
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
            done(err, user);
          });
        });
    },

    function(user, done) {
      var Transport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'af.hadafi',
          pass: '0331492838007'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      Transport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});


router.get('/edit',authenticate_simple,(req,res)=>{
  var id = req.user._id
  if(!id){
    return  res.redirect('/');
  }
  User.findById(id)
      .populate({path:'profileInfo',model:'Profile'})
      .then((user)=>{
          if(!user){return res.redirect('/')}
          res.render('editprofile',{user})
      }).catch((e)=>{
        res.status(400).send(e)
      })
});
router.post('/editprofile',authenticate_simple,upload.single('Image'),async(req,res)=>{
  var first_name     = req.body.first_name,
      last_name      = req.body.last_name,
      email          = req.body.email,
      username       = req.body.username,
      password       = req.body.password,
      password2      = req.body.password2,
      gender         = req.body.gender,
      address        = req.body.address,
      city           = req.body.city,
      id             = req.user._id,
      aboutme        = req.body.aboutme,
      brithday       = req.body.Brithday,
      user           = req.user;     
  if(!id){return  res.redirect('/');}  
  req.checkBody('first_name','firstname field is required').notEmpty()
  req.checkBody('first_name','firstname must atleast 3 charactors').isLength({ min:3 })
  req.checkBody('last_name','lastname field is required').notEmpty()
  req.checkBody('first_name','lastname must atleast 3 charactors').isLength({ min:3 })
  req.checkBody('email','email field is required').notEmpty()
  req.checkBody('email','email must be vaild').isEmail().normalizeEmail()
  req.checkBody('username','username field is required').notEmpty()
  req.checkBody('password2','passwords do not match').equals(req.body.password)
  req.checkBody('gender','gender field is required').notEmpty()
  req.checkBody('email','email must be vaild').isEmail().normalizeEmail()
  if(password){
  req.checkBody('password2','passwords do not match').equals(req.body.password)  
  }
  var emailvalid = []
  var record = await User.find({email})
    if(record[0]){
      if(email !== user.email){
          emailvalid.push('valid')
        }
    }
  
  var errors= req.validationErrors()
  if(errors || emailvalid[0] === 'valid'){
    try{
      var user = await User.find({_id:id}).populate({path:'profileInfo',model:'Profile'});
      if(!user){throw new ERROR('User Not Found')}
      user = user[0]
      var profileInfo=user.profileInfo[0]
      if(emailvalid[0] === 'valid'){
        var error_email = "Email already in use."
      }
      return res.render('editprofile',{user,profileInfo,errors,error_email})
    }catch(e){
      req.flash('error_msg',e.message)
      res.status(400).redirect('/users/edit')
    }
  }else{

    var editprofile;
    if(req.file){
      //delete old profileimage
        var user = await User.findById(id).populate({path:'profileInfo',model:'Profile'});
        if(user.profileInfo[0].profileImage){
          var proImage = user.profileInfo[0].profileImage
          fs.unlinkSync(`C:/Users/Roblix/Desktop/111/afsanauth/public/images/uploads/${proImage}`)
        }
        editprofile = new profileinfo({address,city,brithday,aboutme,profileImage:req.file.filename})
    }else{
        try{
          if(user.profileInfo[0]){
            var profile = await profileinfo.findById(user.profileInfo[0]);
            if(profile.profileImage){
              editprofile = new profileinfo({address,city,brithday,aboutme,profileImage:profile.profileImage})
            }else{
              editprofile = new profileinfo({address,city,brithday,aboutme})  
            }
          }else{
            editprofile = new profileinfo({address,city,brithday,aboutme})  
          }  
        }catch(e){
          res.status(400).send(e.message)
        }
      }
      
    //update profileinfo
    try{
      const user = await User.findByIdAndUpdate(id,{"profileInfo":[]})
      var profileid = user.profileInfo;
      if(profileid[0]){
         await profileinfo.findByIdAndRemove({_id:profileid[0]})
      }
    }catch(e){
      res.status(400).send(e.message)
    }    
    // var edituserup; 
    if(password && password2){
      var salt = bcrypt.genSaltSync(10);
      password = bcrypt.hashSync(password, salt);
      edituserup = {first_name,last_name,email,username,gender,password}
    }else{
      edituserup = {first_name,last_name,email,username,gender}
    }
    
    try{
      var edituser = await User.findByIdAndUpdate(id,{$set:edituserup},{new: true});
      await edituser.profileInfo.push(editprofile)
      await editprofile.save()
      await edituser.save()  
    }catch(e){
    }
    req.flash('success_msg','profile successfully edited.')
    res.redirect('manage')
  }  
});

router.get('/manage',authenticate_simple,(req,res)=>{
  var id = req.user._id
  if(!id){
    return res.redirect('/')
  }
  User.findById(id)
      .populate({path:'profileInfo',model:'Profile'})
      .then((user)=>{
          if(!user){return res.redirect('/')}
          var profileInfo=user.profileInfo[0]
          res.render('profile',{user,profileInfo})
      }).catch((e)=>{
          res.status(400).send(e)
      })
});

router.post('/signin', function(req, res, next) {
  var token = req.session.token
  if(token){
    return res.redirect('/users/manage')
  }else{
    var username  = req.body.username;
    var password  = req.body.password;
    User.findByCredentials(username,password)
    .then((user)=>{
      req.session.token = user.tokens[0].token
      req.flash('success_msg','You are now logged in')
      res.redirect("/users/manage")
    }).catch((e)=>{
      req.flash("error_msg",e)
    res.redirect('/')
    })
  }

});

router.get('/logout', function(req, res, next) {
  req.session.destroy(function(err) {
    if(err){
      res.send(err)
    }
  res.redirect('/')
  })
})

/*Register Routes*/
router.get('/register', function(req, res, next) {
  res.render('register')
});

router.post('/register/newuser',body('email').custom(value => {
  return User.find({email:value}).then(user => {
    if (user[0]) {
      return Promise.reject('E-mail already in use');
    }
  });
  }), function(req, res, next) {
  var first_name     = req.body.firstname;
  var last_name      = req.body.lastname;
  var email          = req.body.email;
  var username       = req.body.username;
  var password       = req.body.password;
  var password2      = req.body.password2;
  var gender         = req.body.gender;
  req.checkBody('firstname','first_name field is required').notEmpty()
  req.checkBody('lastname','last_name field is required').notEmpty()
  req.checkBody('email','email field is required').notEmpty()
  req.checkBody('email','email must be vaild').isEmail().normalizeEmail()
  req.checkBody('username','username field is required').notEmpty()
  req.checkBody('password','password field is required').notEmpty()
  req.checkBody('password2','passwords do not match').equals(req.body.password)
  req.checkBody('gender','gender field is required').notEmpty()
  
  var error = req.validationErrors()
  if(error){
    return  res.render('register',{errors:error})
  }
  else{
    var salt = bcrypt.genSaltSync(10);
    password = bcrypt.hashSync(password, salt);
    var newuser = new User({first_name,last_name,email,gender,username,password}) 
    newuser.generateAuthToken().then((user)=>{
      req.flash('success_msg','you are successfully registered.')
      return  res.redirect('/')
      },(err)=>{
        res.status(400).send(err);
      })
    }
    
 });
 
module.exports = router;
