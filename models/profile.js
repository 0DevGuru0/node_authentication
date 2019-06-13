const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  address:{
    type:String
  },
  profileImage:{
    type:String
  },
  city:{
    type:String
  },
  brithday:{
    type:String
  },
  aboutme:{
    type:String
  }
})

const profileinfo = mongoose.model('Profile',userSchema)
module.exports = {profileinfo}