const mongoose = require('mongoose'),
      jwt = require('jsonwebtoken'),
      bcrypt = require('bcryptjs')
      
var UserSchema = new mongoose.Schema({
  first_name:{
    type:String,
    required:true,
    trim: true,
    minlength:3
  },
  last_name:{
    type:String,
    required:true,
    trim: true,
    minlength:3
  },
  email:{
    type:String,
    required:true,
    unique: true,
    trim: true,
    validate:{
         validator: function(email){ 
         var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
         return emailRegex.test(email);
         },
      message: '{VALUE} is not a valid Email'
    }  
  },
  gender:{
    type:String,
    required:true,
    enum: ['Female','Male']
  },
  username:{
    type:String,
    required:true,
    unique:true,
    minlength:3
  },
  password:{
    type:String,
    required:true,
    unique:true,
    trim: true,
    minlength: 5
  },
  profileInfo:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Profile'
  }],
  tokens:[{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }],
  resetPasswordToken:{
    type:String
  },
  resetPasswordExpires:{
    type:String
  }
})


UserSchema.virtual('fullname').get(function() {  
    return this.first_name + ' ' + this.last_name;
});

UserSchema.methods.generateAuthToken = function(){
  var user = this;
  var access = 'simple_user';
  var token = jwt.sign(
    { _id:user._id.toHexString() , access },
    'private|afsan|key'
  ).toString();
  
  user.tokens.push({access, token});
  return user.save()
}

UserSchema.statics.findByCredentials = function (username, password) {
  var User = this;
  return User.findOne({username}).then((user) => {
    
    if (!user) {
      return Promise.reject('The username you entered doesn\'t belong to an account.\n Please check your username and try again.');
    }
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        }else{
          reject('Sorry, your password was incorrect. Please double-check your password.');
        }
      });
    });

  },(err)=>{return Promise.reject('Something went wrong try again.');})
  }

UserSchema.statics.findByToken = function (token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token,'private|afsan|key');
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};



var User = mongoose.model('users',UserSchema)

module.exports = {User}